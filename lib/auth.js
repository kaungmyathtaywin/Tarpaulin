const jwt = require('jsonwebtoken')

const secretKey = "MyKey"
exports.secretKey = secretKey

exports.generateAuthToken = function (userId) {
    const payload = {
        sub: userId
    }
    return jwt.sign(payload, secretKey, { expiresIn: "24h" })
}

exports.requireAuthentication = async function (req, res, next) {
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer"  ? authHeaderParts[1] : null

    try {
        
    } catch (error) {
        
    }
}