/**
 * Course schema and data accessor methods
 */

const { ObjectId } = require("mongodb")
const { getDb } = require("../lib/mongo")

const joi = require("joi");

/**
 * --- Validation protocols ---
 */

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

/** 
 * Middleware to validate the request body for student enrollment
 */
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
 * --- Data access methods ---
 */

/**
 * Executes a DB query to return a single page of courses.  Returns a
 * Promise that resolves to an array containing the fetched page of courses.
 */
exports.getCoursePage = async function (page, subject, number, term) {
    const db = getDb()
    const collection = db.collection("courses")

    const query = {}
    if (subject != null) query.subject = subject
    if (number != null) query.number = number
    if (term != null) query.term = term

    const documents = await collection.find(query).toArray()
    const count = documents.length

    const pageSize = 5
    const lastPage = Math.ceil(count / pageSize)
    page = page > lastPage ? lastPage : page
    page = page < 1 ? 1 : page
    const offset = (page - 1) * pageSize

    const results = await collection
        .find(query)
        .sort({ _id: 1 })
        .skip(offset)
        .limit(pageSize)
        .project({ students: 0 })
        .toArray()

    return {
        courses: results,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        count: count
    }
}

/**
 * Executes a DB query to insert a new course into the database.  Returns
 * a Promise that resolves to the ID of the newly-created course entry.
 */
exports.insertNewCourse = async function (course) {
    const db = getDb()
    const collection = db.collection('courses')
    const result = await collection.insertOne({ 
        ...course,
        instructorId: new ObjectId(course.instructorId)
    })
    return result.insertedId
}

/**
 * Executes a DB query to fetch a course by ID.  Returns
 * a Promise that resolves to a summary of a given course.
 */
exports.getCoursebyId = async function (id) {
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

/**
 * Executes a DB query to update a specific course by ID. Returns
 * a Promise that resolves to an updated course object or null if the course 
 * to update does not exist.
 */
exports.updateCoursebyId = async function (id, req) {
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

/**
 * Executes a DB query to delete a specific course by ID. Returns
 * a Promise that resolves to deleted count or null if the course 
 * to delete does not exist.
 */
exports.deleteCoursebyId = async function (id) {
    const db = getDb()
    const collection = db.collection('courses')

    if (!ObjectId.isValid(id)) {
        return null
    }

    const result = await collection
    .deleteOne({ _id: new ObjectId(id) })

    return result.deletedCount
}

/**
 * Executes a DB query to fetch students that are enrolled in specified course. Returns
 * a Promise that resolves to a list of students enrolled in a course.
 */
exports.fetchStudents = async function(courseId) {
    const db = getDb()
    const collection = db.collection('courses')

    const results = await collection
    .find({ _id: new ObjectId(courseId) })
    .project({
        _id: 0,
        subject: 0,
        number: 0,
        title: 0,
        term: 0,
        instructorId: 0
    }).toArray()
    return results[0]
}

/**
 * Executes a DB query to update enrollments for a course. Returns
 * a sucess message or null if students to add/remove do not exist in the database.
 */
exports.updateEnrollment = async function (studentsToAdd, studentsToRemove, courseId) {
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