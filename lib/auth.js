const { getCoursebyId } = require('../models/course')
const { getUserbyId } = require('../models/user')

const jwt = require('jsonwebtoken')
const secretKey = "MyKey"

exports.generateAuthToken = function (userId) {
    const payload = {
        sub: userId
    }
    return jwt.sign(payload, secretKey, { expiresIn: "24h" })
}

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

exports.adminAuthentication = async function (req, res, next) {
    if (req.role != "admin") {
        return res.status(403).send({ 
            error: "Invalid authorization to access this resource." 
        })
    }
    next()
}

exports.courseIdValidation = async function (req, res, next) {
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