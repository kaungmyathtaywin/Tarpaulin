/**
 * API sub-router for user collection endpoints.
 */

const { Router } = require('express')
const { validateAgainstSchema } = require('../lib/validation')
const { UserRegisterSchema, UserLoginSchema, insertNewUser, getUserbyId, validateCredentials } = require('../models/user')
const { secretKey, generateAuthToken, getTokenFromHeader, requireAuthentication } = require('../lib/auth')
const { getDb } = require('../lib/mongo')

const router = Router()
const jwt = require('jsonwebtoken')

/**
 * POST /users - Route to create new users
 */
router.post('/', async function (req, res, next) {

    // Validate request body fields
    if (!validateAgainstSchema(req.body, UserRegisterSchema)) {
        return res.status(400).send({
            error: "Request body is not a valid user object."
        })
    }

    if (req.body.role === "student") {
        try {
            const id = await insertNewUser(req.body)
            respondUserCreation(res, id)
        } catch (error) {
            next(error)
        }
    } else {
        next()
    }
}, requireAuthentication, async function(req, res, next) {
    if (req.role === "admin") {
        try {
            const id = await insertNewUser(req.body)
            respondUserCreation(res, id)
        } catch (error) {
            next(error)
        } 
    } else {
        res.status(403).send({
            error: "Invalid authorization for registering this role."
        })
    }
})

/**
 * POST /users/login - Route to login existing users
 */
router.post('/login', async function (req, res, next) {

    // Validate request body fields
    if (!validateAgainstSchema(req.body, UserLoginSchema)) {
        return res.status(400).send({
            error: "Request body has invalid fields for logging in!"
        })
    }
    
    try {
        const authenticated = await validateCredentials(req.body.email, req.body.password)
        const db = getDb()
        const collection = db.collection('users')

        if (authenticated) {
            const result = await collection.find({ email: req.body.email }).toArray()
            const id = result[0]._id.toString()
            const token = generateAuthToken(id)

            res.status(200).send({
                token: token
            })
        } else {
            res.status(401).send({
                error: "Invalid authentication credentials!"
            })
        }
    } catch (error) {
        next(error)
    }
})

/**
 * GET /users/{id} - Route to fetch a specific user's information
 */
router.get('/:userId', requireAuthentication, async function (req, res, next) {
    if (req.user !== req.params.userId) {
        return res.status(403).send({
            error: "Access to this resource is forbidden."
        })
    }

    try {
        const user = await getUserbyId(req.params.userId)
        // TODO: Join student and instructor roles with courses
        if (user) {
            res.status(200).send(user)
        } else {
            next()
        }
    } catch (error) {
        next(error)
    }
})

/**
 * Helper function to send a reponse for user creation.
 */
function respondUserCreation(res, id) {
    if (id) {
        res.status(201).send({ _id: id })
    } else {
        res.status(409).send({
            error: "Email address already exists!"
        })
    }
}

module.exports = router