/**
 * Script to populate Tarpaulin DB with users
 */

require('dotenv').config()

const { connectToDb, closeDbConnection } = require('../lib/mongo')
const { bulkInsertNewUsers } = require('../models/user')

const usersData = require('../data/users.json')

connectToDb().then(async () => {
    /**
     * Insert initial user data into the database
     */
    const ids = await bulkInsertNewUsers(usersData)
    console.log("== Inserted users with IDs:", ids)

    closeDbConnection(() => {
        console.log("== DB connectino closed.")
    })
})