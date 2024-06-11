require('dotenv').config()

const { connectToDb } = require('./lib/mongo')
const { redisClient, rateLimit } = require('./lib/redis')

const express = require('express')
const morgan = require('morgan')
const api = require('./api')
const app = express()
const port = process.env.PORT || 8000

app.use(morgan('dev'))

app.use(express.json())

app.use(rateLimit)

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

connectToDb().then(() => {
    redisClient.connect().then( () => {
        app.listen(port, function () {
            console.log("== Server is running on port", port)
        })
    })
})