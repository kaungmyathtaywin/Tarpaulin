const jwt = require('jsonwebtoken')
const { getUserbyId } = require('../models/user')

const secretKey = "MyKey"

exports.generateAuthToken = function (userId) {
    const payload = {
        sub: userId
    }
    return jwt.sign(payload, secretKey, { expiresIn: "24h" })
}

// function getTokenFromHeader(req) {
//     const authHeader = req.get("Authorization") || ""
//     const authHeaderParts = authHeader.split(" ")
//     return authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null
// }
// exports.getTokenFromHeader = getTokenFromHeader

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