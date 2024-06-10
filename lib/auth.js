const { findCourseByAssignmentId } = require('../models/assignment')
const { getCourseById } = require('../models/course')
const { getUserbyId } = require('../models/user')

const jwt = require('jsonwebtoken')
const secretKey = "MyKey"

/**
 * Generate JWT Webtoken given a payload and secret key
 */
exports.generateAuthToken = function (userId) {
    const payload = {
        sub: userId
    }
    return jwt.sign(payload, secretKey, { expiresIn: "24h" })
}

/**
 * Middleware to check whether the user is logged in or
 * the logged-in user has valid authentication token
 */
exports.requireAuthentication = async function (req, res, next) {
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null

    try {
        const payload = jwt.verify(token, secretKey)
        req.user = payload.sub
        
        const user = await getUserbyId(req.user, true)
        req.role = user.role
        next()
    } catch (error) {
        res.status(401).send({
            error: "Invalid authentication token."
        })
    }
}

/**
 * Middleware to verify the logged in user has 'admin' permissions
 */
exports.authorizeAdminAccess = async function (req, res, next) {
    if (req.role != "admin") {
        return res.status(403).send({ 
            error: "Invalid authorization to access this resource." 
        })
    }
    next()
}

/**
 * Middleware to authorize admin/instructor role for accessing course related data
 */
exports.authorizeCourseRelatedAccess = async (req, res, next) => {
    try {
        const courseId = req.params.courseId || req.body.courseId
        const course = await getCourseById(courseId)

        if (req.role === "admin" || (req.role === "instructor" && req.user === course.instructorId.toString())) {
            return next()
        } else {
            return res.status(403).send({ 
                error: "Invalid authorization to access this resource." 
            })
        }
    } catch (error) {
        next(error)
    }
}

/**
 * Middleware to authorize admin/instructor role for accessing assignment related data
 */
exports.authorizeAssignmentAccess = async (req, res, next) => {
    try {
        const course = await findCourseByAssignmentId(req.params.assignmentId)

        if (req.role === "admin" || (req.role === "instructor" && req.user === course.instructorId.toString())) {
            next()
        } else {
            return res.status(403).send({ 
                error: "Invalid authorization to access this resource." 
            })
        }
    } catch (error) {
        next(error)
    }
}