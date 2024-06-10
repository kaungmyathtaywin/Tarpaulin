require('dotenv').config()

const { connectToDb, closeDbConnection } = require('./lib/mongo')
const { bulkInsertNewUsers } = require('./models/user')

const usersData = require('./data/users.json')

connectToDb().then(async () => {
    /**
     * Insert initial user data into the database
     */
    const ids = await bulkInsertNewUsers()
    console.log("== Inserted users with IDs:", ids)

    closeDbConnection(() => {
        console.log("== DB connectino closed.")
    })
})