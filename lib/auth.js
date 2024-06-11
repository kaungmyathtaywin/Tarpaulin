const { findCourseByAssignmentId } = require('../models/assignment')
const { getCourseById } = require('../models/course')
const { getUserById } = require('../models/user')
const { getDb } = require('./mongo')

const jwt = require('jsonwebtoken')
const secretKey = "MyKey"

/**
 * Generate JWT Webtoken given a payload and secret key
 */
exports.generateAuthToken = (userId) => {
    const payload = {
        sub: userId
    }
    return jwt.sign(payload, secretKey, { expiresIn: "24h" })
}

/**
 * Middleware to check whether the user is logged in or
 * the logged-in user has valid authentication token
 */
exports.requireAuthentication = async (req, res, next) => {
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null

    try {
        const payload = jwt.verify(token, secretKey)
        req.user = payload.sub
        
        const user = await getUserById(req.user, true)
        req.role = user.role
        next()
    } catch (error) {
        res.status(401).send({
            error: "Invalid authentication token."
        })
    }
}

/*
 * Middleware to authenticate user against its credentials
 */
exports.logUserIn = async (req, res, next) => {
    const db = getDb()
    const collection = db.collection('users')
    const result = await collection.find({ email: req.body.email }).toArray()
    const user = result.length > 0 ? result[0] : null

    if (!user && await bcrypt.compare(req.body.password, user.password)) {
        res.status(401).send({
            error: "Invalid authentication credentials."
        })
    } 
    next()
}

/**
 * Middleware to verify the logged in user has 'admin' permissions
 */
exports.authorizeAdminAccess = async (req, res, next) => {
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