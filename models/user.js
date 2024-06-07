/**
 * User schema and data accessor methods
 */
const { ObjectId } = require('mongodb')
const { extractValidFields } = require('../lib/validation')
const { getDb } = require('../lib/mongo')
const bcrypt = require('bcryptjs')

/**
 * Schema describing required/optional fields to register a new user
 */
const UserRegisterSchema = {
    name: { required: true },
    email: { required: true },
    password: { required: true},
    role: { required: true }
}
exports.UserRegisterSchema = UserRegisterSchema

/**
 * Schema describing required/optional fields to log in an existing user
 */
const UserLoginSchema = {
    email: { required: true },
    password: { required: true}
}
exports.UserLoginSchema = UserLoginSchema

/*
 * Executes a DB query to insert a new business into the database.  Returns
 * a Promise that resolves to the ID of the newly-created business entry.
 */
async function insertNewUser(user) {
    user = extractValidFields(user, UserRegisterSchema)
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
exports.insertNewUser = insertNewUser

/*
 * Executes a DB query to fetch a specific user.  Returns
 * a Promise that resolves to a user object if given a valid id or else returns null.
 */
async function getUserbyId(id, includePassword) {
    const db = getDb()
    const collection = db.collection('users')

    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const results = await collection
        .find({ _id: new ObjectId(id) })
        .project( includePassword ? {} : { password: 0 })
        .toArray()
        return results[0]
    }
}
exports.getUserbyId = getUserbyId

/*
 * Executes a DB query to compare the credentials from the client and the database.  Returns
 * a Promise that resolves to a Boolean to indicate the credentials are valid or not.
 */
async function validateCredentials(email, password) {
    const db = getDb()
    const collection = db.collection('users')
    const result = await collection.find({ email: email }).toArray()
    const user = result.length > 0 ? result[0] : null

    return user && await bcrypt.compare(password, user.password)
}
exports.validateCredentials = validateCredentials