const { Router } = require('express')
const { requireAuthentication, adminAuthentication } = require('../lib/auth')
const { 
    insertNewCourse, 
    getCoursebyId, 
    updateCoursebyId, 
    deleteCoursebyId, 
    updateEnrollment, 
    validateCourseBody, 
    validateEnrollmentBody,
    validateCourseId,
    courseUpdateAuthentication
} = require('../models/course')
const { func } = require('joi')

const router = Router()

router.get('/', async function (req, res, next) {
    // TODO:
})

/**
 * POST /courses - Route to create a new course
 */
router.post('/', 
    requireAuthentication,
    adminAuthentication,
    validateCourseBody, 
    async function(req, res, next) {
        try {
            const id = await insertNewCourse(req.body)

            res.status(201).send({ _id: id })
        } catch (error) {
            next(error)
        }
})


/**
 * GET /courses/{id} - Route to fetch a specific course information
 */
router.get('/:courseId', 
    validateCourseId,
    async function(req, res, next) {
        try {
            const course = await getCoursebyId(req.params.courseId)

            res.status(200).send(course)
        } catch (error) {
            next(error)
        }
})

/**
 * PATCH /courses/{id} - Route to update a specific course information
 */
router.patch('/:courseId', 
    requireAuthentication, 
    courseUpdateAuthentication, 
    validateCourseBody,
    validateCourseId,
    async function(req, res, next) {
        try {
            await updateCoursebyId(req.params.courseId, req)

            res.status(200).send()
        } catch (error) {
            next(error)
        }
})

/**
 * DELETE /courses/{id} - Route to delete a specific course
 */
router.delete('/:courseId', 
    requireAuthentication,
    adminAuthentication,
    validateCourseId, 
    async function(req, res, next) {
        try {
            await deleteCoursebyId(req.params.courseId)
            
            res.status(204).send()
        } catch (error) {
            next(error)
        }
})

router.get('/', async function(req, res, next) {
    // TODO:
})

/**
 * POST /courses/{courseId}/students
 */
router.post('/:courseId/students', 
    requireAuthentication,
    courseUpdateAuthentication,
    validateEnrollmentBody,
    validateCourseId,
    async function(req, res, next) {
        try {
            const { add, remove } = req.body
            const result = await updateEnrollment(add, remove, course._id)

            if (result) {
                return res.status(201).send()
            } else {
                return res.status(400).send({
                    error: "Please make sure all the students to add/remove are valid."
                })
            }
        } catch (error) {
            next(error)
        }
})

/**
 * GET /courses/{courseId}/roster
 */
router.get('/:courseId/roster', async function(req, res, next) {
    // TODO:
})

/**
 * GET /courses/{courseId}/assignments
 */
router.get('/:courseId/assignments', async function(req, res, next) {
    // TODO:
})

module.exports = router