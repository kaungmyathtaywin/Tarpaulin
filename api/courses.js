/**
 * API sub-router for course collection endpoints.
 */

const { Router } = require('express')
const { validateCourseId } = require('../lib/validation')
const { 
    requireAuthentication, 
    authorizeAdminAccess, 
    authorizeCourseRelatedAccess 
} = require('../lib/auth')
const {
    validateCourseBody, 
    validateEnrollmentBody,
    getCoursePage,
    insertNewCourse, 
    getCourseById, 
    updateCourseById, 
    deleteCourseById, 
    updateEnrollment, 
    fetchStudents
} = require('../models/course')

const router = Router()

/**
 * GET /courses - Route to fetch a list of courses specified by query parameter
 */
router.get('/', async (req, res, next) => {
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
    async (req, res, next) => {
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
    async (req, res, next) => {
        try {
            const course = await getCourseById(req.params.courseId)

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
    validateCourseId,
    authorizeCourseRelatedAccess, 
    validateCourseBody,
    async (req, res, next) => {
        try {
            await updateCourseById(req.params.courseId, req)

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
    validateCourseId,
    authorizeAdminAccess,
    async (req, res, next) => {
        try {
            await deleteCourseById(req.params.courseId)
            
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
    validateCourseId,
    authorizeCourseRelatedAccess,
    async (req, res, next) => {
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
    validateCourseId,
    authorizeCourseRelatedAccess,
    validateEnrollmentBody,
    async (req, res, next) => {
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
 * GET /courses/{courseId}/roster -
 */
router.get('/:courseId/roster', async function(req, res, next) {
    // TODO:
})

/**
 * GET /courses/{courseId}/assignments -
 */
router.get('/:courseId/assignments', async function(req, res, next) {
    // TODO:
})

module.exports = router