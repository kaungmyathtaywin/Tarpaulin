/**
 * 
 */

const { getCoursebyId } = require("../models/course")

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
exports.authorizeCourseAccess = async function (req, res, next) {
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