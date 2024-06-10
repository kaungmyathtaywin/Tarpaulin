const { Router } = require('express')

const usersRouter = require('./users')
const coursesRouter = require('./courses')
const assignmentsRouter = require('./assignments')

const router = Router()

router.use('/users', usersRouter)
router.use('/courses', coursesRouter)
router.use('/assignments', assignmentsRouter)

module.exports = router