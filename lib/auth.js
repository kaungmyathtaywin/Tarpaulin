const jwt = require('jsonwebtoken')
const { getUserbyId } = require('../models/user')

const secretKey = "MyKey"
exports.secretKey = secretKey

exports.generateAuthToken = function (userId) {
    const payload = {
        sub: userId
    }
    return jwt.sign(payload, secretKey, { expiresIn: "24h" })
}

function getTokenFromHeader(req) {
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    return authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null
}
exports.getTokenFromHeader = getTokenFromHeader

exports.requireAuthentication = async function (req, res, next) {
    const token = getTokenFromHeader(req)

    try {
        const payload = jwt.verify(token, secretKey)
        req.user = payload.sub
        
        next()
    } catch (error) {
        res.status(401).send({
            error: "Invalid authentication token"
        })
    }
}