/**
 * User schema and data accessor methods
 */

const { ObjectId } = require('mongodb')
const { getDb } = require('../lib/mongo')

const bcrypt = require('bcryptjs')
const joi = require('joi')


/**
 * =============================================================================
 * Validation Protocols
 * =============================================================================
 */

/**
 * Schema describing required/optional fields to register a new user
 */
const UserSchema = joi.object({
    name: joi.string(),
    email: joi.string(),
    password: joi.string(),
    role: joi.string(),
    courses: joi.array().items(joi.string().length(24).hex())
})

/**
 * Middleware to validate the request body against user schema
 */ 
exports.validateUserBody = function (req, res, next) {
    const result = UserSchema.validate(req.body, { allowUnknown: false, presence: 'optional' });
    if (result.error) {
        res.status(400).send({
            error: "Request body is not a valid user object."
        });
    } else {
        next();
    }
}


/**
 * =============================================================================
 * Data Access Methods
 * =============================================================================
 */

/*
 * Executes a DB query to insert a new business into the database.  
 *
 * Returns a Promise that resolves to the ID of the newly-created business entry.
 */
exports.insertNewUser = async function (user) {
    const db = getDb()
    const collection = db.collection('users')
    const duplicateEmail = await collection.find({ email: user.email }).toArray()

    if (duplicateEmail.length === 0) {
        const hash = await bcrypt.hash(user.password, 8)

        const result = await collection.insertOne({
            ...user,
            password: hash
        })
        return result.insertedId
    } else {
        return null
    }
}

/*
 * Executes a DB query to fetch a specific user.  
 * 
 * Returns a Promise that resolves to a user object if given a valid id or else returns null.
 */
exports.getUserById = async function (id, includePassword) {
    const db = getDb()
    const collection = db.collection('users')

    if (!ObjectId.isValid(id)) {
        return null
    } 

    const results = await collection
    .find({ _id: new ObjectId(id) })
    .project( includePassword ? {} : { password: 0 })
    .toArray()
    return results[0]
}

/*
 * Executes a DB query to fetch a user by email.
 * 
 * Returns a Promise that resolves to ID of fetched user or null if the user doesn't exist.
 */
exports.getUserByEmail = async function (email) {
    const db = getDb()
    const collection = db.collection('users')
    const result = await collection.find({ email: email }).toArray()

    if (result) {
        return result[0]._id.toString()
    } else {
        return null
    }
}

/*
 * Executes a DB query to bulk insert an array new users into the database.
 * 
 * Returns a Promise that resolves to a map of the IDs of the newly-created
 * user entries.
 */
exports.bulkInsertNewUsers = async (users) => {
    const db = getDb()
    const collection = db.collection('users')
    const result = await collection.insertMany(users)
    return result.insertedId
}