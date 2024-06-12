/**
 * Course schema and data accessor methods
 */

const { ObjectId } = require("mongodb")
const { getDb } = require("../lib/mongo")
const joi = require("joi");
const {getChannel, queueName} = require('../lib/rabbitmq');
const path = require('path');
const { createCsvFile, getLatestCsvFilePath } = require("./csvconsumer");


/**
 * =============================================================================
 * Validation Protocols
 * =============================================================================
 */

/**
 * Schema describing required/optional fields to create a new course
 */
const CourseSchema = joi.object({
    subject: joi.string().required(),
    number: joi.string().required(),
    title: joi.string().required(),
    term: joi.string().required(),
    instructorId: joi.string().length(24).hex().required(),
    students: joi.array().items(joi.string().length(24).hex()),
    assignments: joi.array().items(joi.string().length(24).hex())
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
exports.validateCourseBody = (req, res, next) => {
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
exports.validateEnrollmentBody = (req, res, next) => {
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
 * =============================================================================
 * Data Access Methods
 * =============================================================================
 */

/**
 * Executes a DB query to return a single page of courses.
 * 
 * Returns a Promise that resolves to an array containing the fetched page of courses.
 */
exports.getCoursePage = async (page, subject, number, term) => {
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
        .project({ students: 0, assignments: 0 })
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
 * Executes a DB query to insert a new course into the database.
 * 
 * Returns a Promise that resolves to the ID of the newly-created course entry.
 */
exports.insertNewCourse = async (course) => {
    const db = getDb()
    const courses = db.collection('courses')
    const users = db.collection('users')
    const instructorId = new ObjectId(course.instructorId)

    const result = await courses.insertOne({ 
        ...course,
        instructorId: instructorId
    })

    await users.updateOne(
        { _id: instructorId },
        { $addToSet: { courses: result.insertedId }}
    )

    return result.insertedId
}

/**
 * Executes a DB query to fetch a course by ID.
 * 
 * Returns a Promise that resolves to a summary of a given course.
 */
exports.getCourseById = async (id) => {
    const db = getDb()
    const collection = db.collection('courses')

    if (!ObjectId.isValid(id)) {
        return null
    }

    const results = await collection
    .find({ _id: new ObjectId(id) })
    .project({ 
        students: 0,
        assignments: 0
    })
    .toArray()
    return results[0] 
}

/**
 * Executes a DB query to update a specific course by ID.
 *  
 * Returns a Promise that resolves to an updated course object or
 * null if the course to update does not exist.
 */
exports.updateCourseById = async (id, req) => {
    const db = getDb()
    const collection = db.collection('courses')

    if (!ObjectId.isValid(id)) {
        return null
    }

    const updateData = { ...req.body }
    delete updateData.students
    delete updateData.assignments

    const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after", runValidators: true }
    )

    return result
}

/**
 * Executes a DB query to delete a specific course by ID.
 * 
 * Returns a Promise that resolves to deleted count or 
 * null if the course to delete does not exist.
 */
exports.deleteCourseById = async (id) => {
    const db = getDb()
    const courses = db.collection('courses')
    const users = db.collection('users')
    const courseId = new ObjectId(id)

    if (!ObjectId.isValid(id)) {
        return null
    }

    const result = await courses
    .deleteOne({ _id: courseId })

    // Delete courseId from student/instructor courses
    await users.updateMany(
        { courses: courseId },
        { $pull: { courses: courseId }}
    )

    return result.deletedCount
}

/**
 * Executes a DB query to fetch students that are enrolled in the specified course.
 * 
 * Returns a Promise that resolves to a list of students enrolled in a course.
 */
exports.fetchStudents = async (courseId) => {
    const db = getDb()
    const collection = db.collection('courses')
    const pipeline = [
        { $match: { _id: new ObjectId(courseId) }},
        { $lookup: {
            from: 'users',
            localField: 'students',
            foreignField: '_id',
            as: 'students',
            pipeline: [
                { $project: { courses: 0 } }
            ]
        }},
        { $project: {
            _id: 0,
            students: 1
        }}
    ]

    const results = await collection.aggregate(pipeline).toArray()
    return results[0]
}

/**
 * Executes a DB query to update enrollments for a course.
 * 
 * Returns a sucess message or null if students to add/remove do not exist in the database.
 */
exports.updateEnrollment = async (studentsToAdd, studentsToRemove, courseId) => {
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
        updateEnrollmentHelper(courseId, addStudentIds, true)
    }

    if (removeStudentIds.length > 0) {
        updateEnrollmentHelper(courseId, removeStudentIds, false)
    }

    return "Update Successful"
}

/**
 * Executes a DB query to fetch assignments associated with a course.
 * 
 * Returns a Promise that resolves to a list of assignments associated with a course. 
 */
exports.fetchAssignments = async (courseId) => {
    const db = getDb()
    const collection = db.collection('courses')
    const pipeline = [
        { $match: { _id: new ObjectId(courseId) }},
        { $lookup: {
            from: 'assignments',
            localField: 'assignments',
            foreignField: '_id',
            as: 'assignments'
        }},
        { $project: {
            _id: 0,
            assignments: 1
        }}
    ]

    const results = await collection.aggregate(pipeline).toArray()
    return results[0]
}

/**
 * Creates a CSV file by executing code in the background.
 * 
 * Returns a url that allows user to download the csv file of the roster of the class. 
 */
exports.createCsv = async (courseId) => {
    const db = getDb()
    const collection = db.collection('courses')
    const pipeline = [
        { $match: { _id: new ObjectId(courseId) }},
        { $lookup: {
            from: 'users',
            localField: 'students',
            foreignField: '_id',
            as: 'students'
        }},
        { $project: {
            _id: 0,
            students: 1
        }}
    ]
    const channel = getChannel()
    const results = await collection.aggregate(pipeline).toArray()
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(results[0])))
    
    await createCsvFile()
    const filePath = getLatestCsvFilePath()
    const fileName = path.basename(filePath)
    const url = `/courses/roster/${fileName}`
    return url
}

/* =============================================================================
 * Helper functions
 * =============================================================================
 */

/**
 * Helper function to update student enrollments in usersDb and coursesDb
 */
async function updateEnrollmentHelper(courseId, studentIds, add) {
    const db = getDb()
    const courses = db.collection('courses')
    const users = db.collection('users')
    const updateOperation = {}

    if (add) {
        updateOperation.bulk = { $addToSet: { students: { $each: studentIds } } }
        updateOperation.single = { $addToSet: { courses: new ObjectId(courseId) } }
    } else {
        updateOperation.bulk = { $pullAll: { students: studentIds } }
        updateOperation.single =  { $pull: { courses: new ObjectId(courseId) }}
    }

    try {
        await courses.updateOne(
            { _id: new ObjectId(courseId) },
            updateOperation.bulk
        )
        
        const updates = studentIds.map(id => users.updateOne(
            { _id: id },
            updateOperation.single
        ))

        await Promise.all(updates);
    } catch (error) {
        return error
    }
}