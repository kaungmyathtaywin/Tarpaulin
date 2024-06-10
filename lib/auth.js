const { getCoursebyId } = require('../models/course')
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