/**
 * Course schema and data accessor methods
 */

const { ObjectId } = require("mongodb")
const { getDb } = require("../lib/mongo")

const joi = require("joi");

/**
 * Schema describing required/optional fields to create a new course
 */
const CourseSchema = joi.object({
    subject: joi.string(),
    number: joi.string(),
    title: joi.string(),
    term: joi.string(),
    instructorId: joi.string().length(24).hex(),
    students: joi.array().items(joi.string().length(24).hex())
})

/**
 * Schema to validate enrollment updates
 */
const ModifyEnrollmentSchema = joi.object({
    add: joi.array().items(joi.string().length(24).hex()),
    remove: joi.array().items(joi.string().length(24).hex())
}).or('add', 'remove').min(1);

/**
 * Middleware to validate the request body against course schema
 */ 
exports.validateCourseBody = function (req, res, next) {
    const result = CourseSchema.validate(req.body, { allowUnknown: false, presence: 'optional' });
    if (result.error) {
        res.status(400).send({
            error: "Request body is not a valid course object."
        })
    } else {
        next()
    }
}

exports.validateEnrollmentBody = function (req, res, next) {
    const result = ModifyEnrollmentSchema.validate(req.body, { allowUnknown: false, presence: 'optional' })
    if (result.error) {
        res.status(400).send({
            error: "Request body is not a valid update enrollment object."
        })
    } else {
        next()
    }
}

/**
 * Executes a DB query to insert a new course into the database.  Returns
 * a Promise that resolves to the ID of the newly-created course entry.
 */
async function insertNewCourse(course) {
    const db = getDb()
    const collection = db.collection('courses')
    const result = await collection.insertOne({ 
        ...course,
        instructorId: new ObjectId(course.instructorId)
    })
    return result.insertedId
}
exports.insertNewCourse = insertNewCourse

/**
 * Executes a DB query to fetch a specific course.  Returns
 * a Promise that resolves to a summary of a given course.
 */
async function getCoursebyId(id) {
    const db = getDb()
    const collection = db.collection('courses')

    if (!ObjectId.isValid(id)) {
        return null
    }

    const results = await collection
    .find({ _id: new ObjectId(id) })
    .toArray()
    return results[0] 
}
exports.getCoursebyId = getCoursebyId

/**
 * Executes a DB query to update a specific course. Returns
 * null if the course to update does not exist
 */
async function updateCoursebyId(id, req) {
    const db = getDb()
    const collection = db.collection('courses')

    if (!ObjectId.isValid(id)) {
        return null
    }

    const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: req.body },
        { new: true, runValidators: true }
    )

    return result
}
exports.updateCoursebyId = updateCoursebyId

/**
 * Executes a DB query to delete a specific course. Returns
 * a Promise that resolves to deleted count or null if the course 
 * to delete does not exist.
 */
async function deleteCoursebyId(id) {
    const db = getDb()
    const collection = db.collection('courses')

    if (!ObjectId.isValid(id)) {
        return null
    }

    const result = await collection
    .deleteOne({ _id: new ObjectId(id) })

    return result.deletedCount
}
exports.deleteCoursebyId = deleteCoursebyId

/**
 *
 */
async function updateEnrollment(studentsToAdd, studentsToRemove, courseId) {
    const db = getDb()
    const users = db.collection('users')
    const courses = db.collection('courses')

    const addStudentIds = studentsToAdd.map(studentId => new ObjectId(studentId))
    const removeStudentIds = studentsToRemove.map(studentId => new ObjectId(studentId))
    
    const addStudents = await users.find({ _id: { $in: addStudentIds }, role: 'student' }).toArray()
    const removeStudents = await users.find({ _id: { $in: removeStudentIds }, role: 'student' }).toArray()

    if (addStudentIds.length !== addStudents.length || removeStudentIds.length !== removeStudents.length) {
        return null
    }

    if (addStudentIds.length > 0) {
        await courses.updateOne(
            { _id: new ObjectId(courseId) },
            { $addToSet: { students: { $each: addStudentIds } } }
        )
    }

    if (removeStudentIds.length > 0) {
        await courses.updateOne(
            { _id: new ObjectId(courseId) },
            { $pullAll: { students: removeStudentIds } }
        );
    }

    return "Update Successful"
}
exports.updateEnrollment = updateEnrollment

/**
 * 
 */
exports.validateCourseId = async function (req, res, next) {
    try {
        const course = await getCoursebyId(req.params.courseId)
    
        if (!course) {
            return res.status(404).send({
                error: "Specified course does not exist."
            })
        }
        return next()
    } catch (error) {
        next(error)
    }
}

/**
 * 
 */
exports.courseUpdateAuthentication = async function (req, res, next) {
    try {
        const course = await getCoursebyId(req.params.courseId)

        if (!course) {
            return res.status(404).send({
                error: "Specified course does not exist."
            })
        }

        if (req.role === "admin" || (req.role === "instructor" && req.user === course.instructorId.toString())) {
            return next();
        } else {
            return res.status(403).send({ 
                error: "Invalid authorization to access this resource." 
            })
        }
    } catch (error) {
        next(error)
    }
}