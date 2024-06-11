/*
 * Module for working with Redis connection.
 */

const redis = require('redis')

const redisHost = process.env.REDIS_HOST || "localhost"
const redisPort = process.env.REDIS_PORT || 6379

const redisClient = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`
})
exports.redisClient = redisClient

const rateLimitMaxReqs = 10
const rateLimitWindowMs = 60000

/**
 * Middleware to rate limit all API endpoints
 */
exports.rateLimit = async (req, res, next) => {
    const ip = req.ip
    let tokenBucket

    try {
        tokenBucket = await redisClient.hGetAll(ip)
    } catch (error) {
        return res.status(500).send({
            error: "Redis server error."
        })
    }

    tokenBucket = {
        tokens: parseFloat(tokenBucket.tokens) || rateLimitMaxReqs,
        last: parseInt(tokenBucket.last) || Date.now()
    }

    const timestamp = Date.now()
    const ellapsedTimeMs = timestamp - tokenBucket.last
    const refreshRate = rateLimitMaxReqs / rateLimitWindowMs

    tokenBucket.tokens += ellapsedTimeMs * refreshRate
    tokenBucket.tokens = Math.min(rateLimitMaxReqs, tokenBucket.tokens)
    tokenBucket.last = timestamp

    if (tokenBucket.tokens >= 1) {
        tokenBucket.tokens -= 1
        await redisClient.hSet(ip, [
            ['tokens', tokenBucket.tokens],
            ['last', tokenBucket.last]
        ])
        next()
    } else {
        res.status(429).send({
            error: "Too many requests per minute."
        })
    }
}