const { ObjectId, ReturnDocument, Timestamp } = require("mongodb")
const { getDb } = require("../lib/mongo")

const joi = require("joi")
const path = require('path')

/**
 * =============================================================================
 * Validation Protocols
 * =============================================================================
 */

/**
 * Schema describing required/optional fields to patch a submission
 */
const SubmissionSchema = joi.object({
    assignmentId: joi.string().length(24).hex(),
    studentId: joi.string().length(24).hex(),
    timeStamp: joi.date().iso(),
    grade: joi.number(),
    file: joi.string()
})

/**
 * Middleware to validate the request body against submission schema
 */
exports.validateSubmissionFields = (req, res, next) => {
    const result = SubmissionSchema.validate(req.body, { allowUnknown: false, presence: 'optional' });
    if (result.error) {
        res.status(400).send({
            error: "Request body does not contain a valid submission field."
        })
    } else {
        next()
    }
}

/**
 * Executes a DB query to update a specific submission by ID.
 *  
 * Returns a Promise that resolves to an updated submission object or
 * null if the submission to update does not exist.
 */
exports.patchSubmissionById = async (id, req) => {
    const db = getDb()
    const collection = db.collection('submissions')

    if (!ObjectId.isValid(id)) {
        return null
    }

    const updateData = { ...req.body }
    console.log("Update:", updateData)

    const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after", runValidators: true }
    )

    return result
}