require('dotenv').config()

const express = require('express')
const morgan = require('morgan')

const api = require('./api')
const { connectToDb } = require('./lib/mongo')
const {connectToRabbitMQ} = require('./lib/rabbitmq')

const app = express()
const port = process.env.PORT || 8000

app.use(morgan('dev'))

app.use(express.json())

/**
 * All the routes are in api folder
 */
app.use('/', api)

app.use('*', function (req, res, next) {
    res.status(404).send({
        error: "Requested resource " + req.originalUrl + " does not exist."
    })
})

app.use('*', function (err, req, res, next) {
    console.log("== Error:", err)
    res.status(500).send({
        error: "Server error. Please try again later."
    })
})

connectToDb().then(async function () {
    await connectToRabbitMQ()
    app.listen(port, function () {
        console.log("== Server is running on port", port)
    })
})