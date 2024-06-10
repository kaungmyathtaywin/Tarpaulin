/**
 * API sub-router for course collection endpoints.
 */

const { Router } = require('express')
const { requireAuthentication, authorizeAdminAccess } = require('../lib/auth')
const {
    validateCourseBody, 
    validateEnrollmentBody,
    getCoursePage,
    insertNewCourse, 
    getCoursebyId, 
    updateCoursebyId, 
    deleteCoursebyId, 
    updateEnrollment, 
    fetchStudents,
    validateCourseId,
    authorizeCourseAccess
} = require('../models/course')

const router = Router()

/**
 * GET /courses - Route to fetch a list of courses specified by query parameter
 */
router.get('/', async function (req, res, next) {
    try {
        const coursePage = await getCoursePage(
            parseInt(req.query.page) || 1, 
            req.query.subject,
            req.query.number,
            req.query.term
        )

        res.status(200).send(coursePage)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /courses - Route to create a new course
 */
router.post('/', 
    requireAuthentication,
    authorizeAdminAccess,
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
 * GET /courses/{id} - Route to fetch the specified course's information
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
 * PATCH /courses/{id} - Route to update the specified course's information
 */
router.patch('/:courseId', 
    requireAuthentication, 
    authorizeCourseAccess, 
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
 * DELETE /courses/{id} - Route to delete the specified course
 */
router.delete('/:courseId', 
    requireAuthentication,
    authorizeAdminAccess,
    validateCourseId, 
    async function(req, res, next) {
        try {
            await deleteCoursebyId(req.params.courseId)
            
            res.status(204).send()
        } catch (error) {
            next(error)
        }
})

/**
 * GET /courses/{courseId}/students - Route to fetch a list of students enrolled in a course
 */
router.get('/:courseId/students', 
    requireAuthentication,
    authorizeCourseAccess,
    validateCourseId,
    async function(req, res, next) {
        try {
            const students = await fetchStudents(req.params.courseId)
            
            res.status(200).send(students)
        } catch (error) {
            next(error)
        }
})

/**
 * POST /courses/{courseId}/students - Route to add/remove students to a course
 */
router.post('/:courseId/students', 
    requireAuthentication,
    authorizeCourseAccess,
    validateEnrollmentBody,
    validateCourseId,
    async function(req, res, next) {
        try {
            const { add, remove } = req.body
            const result = await updateEnrollment(add, remove, req.params.courseId)

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