const { Router } = require('express')

const usersRouter = require('./users')
const coursesRouter = require('./courses')
const assignmentsRouter = require('./assignments')
const submissionsRouter = require('./submissions')
const mediaRouter = require('./media')

const router = Router()

router.use('/users', usersRouter)
router.use('/courses', coursesRouter)
router.use('/assignments', assignmentsRouter)
router.use('/submissions', submissionsRouter)
router.use('/media', mediaRouter)

module.exports = router