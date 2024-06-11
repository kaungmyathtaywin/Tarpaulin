const { getAssignmentById } = require("../models/assignment")
const { getCourseById } = require("../models/course")
const { getUserById } = require("../models/user")

/*
 * Performs data validation on an object by verifying that it contains
 * all required fields specified in a given schema.
 *
 * Returns true if the object is valid agianst the schema and false otherwise.
 */
exports.validateAgainstSchema = (obj, schema) => {
    return obj && Object.keys(schema).every(
        field => !schema[field].required || obj[field]
    )
}

/*
 * Extracts all fields from an object that are valid according to a specified
 * schema.  Extracted fields can be either required or optional.
 *
 * Returns a new object containing all valid fields extracted from the
 * original object.
 */
exports.extractValidFields = (obj, schema) => {
    let validObj = {}
    Object.keys(schema).forEach((field) => {
        if (obj[field]) {
            validObj[field] = obj[field]
        }
    })
    return validObj
}

/**
 * Middleware to verify whether the requested course exists or not
 */
exports.validateCourseId = async (req, res, next) => {
    try {
        const courseId = req.params.courseId || req.body.courseId
        const course = await getCourseById(courseId)
    
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
 * Middleware to verify whether the requested instructor exists
 */
exports.validateInstructorId = async (req, res, next) => {
    try {
        const user = await getUserById(req.body.instructorId)

        if (!user) {
            return res.status(404).send({
                error: "Specified instructor in the request body does not exist."
            })
        }
        return next()
    } catch (error) {
        next(error)
    }
}

/**
 * Middleware to verify whether the requested assignment exists or not
 */
exports.validateAssignmentId = async (req, res, next) => {
    try {
        const assignment = await getAssignmentById(req.params.assignmentId)
    
        if (!assignment) {
            return res.status(404).send({
                error: "Specified assignment does not exist."
            })
        }
        return next()
    } catch (error) {
        next(error)
    }
}