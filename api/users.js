/**
 * API sub-router for user collection endpoints.
 */

const { Router } = require('express')
const {
    validateUserBody,
    insertNewUser, 
    getUserbyId,
    logUserIn,
    getUserbyEmail
} = require('../models/user')
const { 
    generateAuthToken, 
    requireAuthentication, 
    authorizeAdminAccess 
} = require('../lib/auth')

const router = Router()

/**
 * POST /users - Route to create new users
 */
router.post('/', 
    validateUserBody, 
    async function (req, res, next) {
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
    }, 
    requireAuthentication,
    authorizeAdminAccess,
    async function(req, res, next) {
        try {
            const id = await insertNewUser(req.body)
            respondUserCreation(res, id)
        } catch (error) {
            next(error)
        }
})

/**
 * POST /users/login - Route to login existing users
 */
router.post('/login', 
    validateUserBody,
    logUserIn,
    async function (req, res, next) {
        try {
            const userId = await getUserbyEmail(req.body.email)
            const token = generateAuthToken(userId)

            res.status(200).send({
                token: token
            })
        } catch (error) {
            next(error)
        }
})

/**
 * GET /users/{id} - Route to fetch a specific user's information
 */
router.get('/:userId', 
    requireAuthentication, 
    async function (req, res, next) {
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