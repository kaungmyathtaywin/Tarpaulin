/*
 * Module for working with a MongoDB connection.
 */

const { MongoClient } = require('mongodb')

const mongoHost = process.env.MONGO_HOST || 'localhost'
const mongoPort = process.env.MONGO_PORT || 30004
const mongoUser = process.env.MONGO_USER
const mongoPassword = process.env.MONGO_PASSWORD
const mongoDbName = process.env.MONGO_DB
const mongoAuthDbName = process.env.MONGO_AUTH_DB || mongoDbName

const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoAuthDbName}`

let _db = null
let _closeDbConnection = null

exports.connectToDb = async function (callback) {
    const client = await MongoClient.connect(mongoUrl)
    _db = client.db(mongoDbName)
    _closeDbConnection = function () {
        client.close()
    }
}

exports.getDb = function () {
    return _db
}

exports.closeDbConnection = function (callback) {
    _closeDbConnection(callback)
}
