/**
 * Course schema and data accessor methods
 */

const { ObjectId } = require("mongodb")
const { getDb } = require("../lib/mongo")
const { extractValidFields } = require("../lib/validation");
const joi = require("joi");

/**
 * Schema describing required/optional fields to create a new course
 */
const CourseSchema = joi.object({
    subject: joi.string(),
    number: joi.string(),
    title: joi.string(),
    term: joi.string(),
    instructorId: joi.string().length(24).hex()
});
exports.CourseSchema = CourseSchema

/**
 * Middleware to validate the request body against course schema
 */ 
function validateCourse(req, res, next) {
    const result = CourseSchema.validate(req.body, { allowUnknown: false, presence: 'optional' });
    if (result.error) {
        res.status(400).send({
            error: "Request body is not a valid course object."
        });
    } else {
        next();
    }
}
exports.validateCourse = validateCourse

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