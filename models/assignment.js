/**
 * Assignment schema and data accessor methods
 */

const { ObjectId, ReturnDocument } = require("mongodb")
const { getCoursebyId } = require("./course")
const { getDb } = require("../lib/mongo")

const joi = require("joi")


/**
 * =============================================================================
 * Validation Protocols
 * =============================================================================
 */

/**
 * Schema describing required/optional fields to create a new assignment
 */
const AssignmentSchema = joi.object({
    courseId: joi.string().length(24).hex().required(),
    title: joi.string().required(),
    points: joi.number().required(),
    due: joi.string().required(),
    submissions: joi.array().items(joi.string().length(24).hex())
})

/**
 * Middleware to validate the request body against assignment schema
 */
exports.validateAssignmentBody = (req, res, next) => {
    const result = AssignmentSchema.validate(req.body, { allowUnknown: false, presence: 'optional' });
    if (result.error) {
        res.status(400).send({
            error: "Request body is not a valid assignment object."
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
 * Executes a DB query to insert a new assignment into the database.
 * 
 * Returns a Promise that resolves to the ID of the newly-created assignment entry.
 */
exports.insertNewAssignment = async (assignment, courseId) => {
    const db = getDb()
    const assignments = db.collection('assignments')
    const courses = db.collection('courses')

    const result = await assignments.insertOne(assignment)

    await courses.updateOne(
        { _id: new ObjectId(courseId) },
        { $addToSet: { assignments: result.insertedId }}
    )

    return result.insertedId
}

/**
 * Executes a DB query to fetch an assignment by ID.
 * 
 * Returns a Promise that resolves to a summary of a given assignment. 
 */
exports.getAssignmentById = async (id) => {
    const db = getDb()
    const collection = db.collection('assignments')

    if (!ObjectId.isValid(id)) {
        return null
    }

    const results = await collection
    .find({ _id: new ObjectId(id) })
    .project({ submissions: 0 })
    .toArray()
    return results[0] 
}

/**
 * Executes a DB query to update a specific assignment by ID.
 *  
 * Returns a Promise that resolves to an updated assignment object or
 * null if the assignment to update does not exist.
 */
exports.updateAssignmentById = async (id, req) => {
    const db = getDb()
    const collection = db.collection('assignments')

    if (!ObjectId.isValid(id)) {
        return null
    }

    const updateData = { ...req.body }
    delete updateData.submissions

    const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after", runValidators: true }
    )

    return result
}

/**
 * Executes a DB query to delete a specific assignment by ID.
 * 
 * Returns a Promise that resolves to deleted count or 
 * null if the assignment to delete does not exist. 
 */
exports.deleteAssignmentById = async (id) => {
    const db = getDb()
    const assignments = db.collection('assignments')
    const courses = db.collection('courses')

    if (!ObjectId.isValid(id)) {
        return null
    }

    const result = await assignments
    .deleteOne({ _id: new ObjectId(id) })

    const course = await findCourseByAssignmentId(id)

    await courses.updateOne(
        { _id: course._id },
        { $pull: { assignments: new ObjectId(id) }}
    )

    return result.deletedCount
}

/**
 * Executes a DB query to find a course associated with given assignment ID.
 * 
 * Returns a Promise that resolves to the course object or 
 * null if the course associated with the assignment does not exist. 
 */
async function findCourseByAssignmentId(assignmentId) {
    const db = getDb()
    const collection = db.collection('courses')

    const query = { assignments: new ObjectId(assignmentId) }
    const course = await collection.findOne(query)

    if (course) {
        return course
    } else {
        return null
    }
}
exports.findCourseByAssignmentId = findCourseByAssignmentId