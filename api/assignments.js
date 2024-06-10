/**
 * API sub-router for assignment collection endpoints.
 */

const { Router } = require('express')
const { validateCourseId, validateAssignmentId } = require('../lib/validation')
const { 
    requireAuthentication, 
    authorizeCourseRelatedAccess, 
    authorizeAssignmentAccess 
} = require('../lib/auth')
const { 
    validateAssignmentBody, 
    insertNewAssignment, 
    getAssignmentById, 
    updateAssignmentById, 
    deleteAssignmentById 
} = require('../models/assignment')

const router = Router()

/**
 * POST /assignments - Route to create a new assignment
 */
router.post('/',
    requireAuthentication,
    validateCourseId,
    authorizeCourseRelatedAccess,
    validateAssignmentBody,
    async (req, res, next) => {
        try {
            const id = await insertNewAssignment(req.body, req.body.courseId)

            res.status(201).send({ _id: id })
        } catch (error) {
            next(error)
        }
})

/**
 * GET /assignments/{assignmentId} - Route to fetch the specified assignment's information
 */
router.get('/:assignmentId',
    validateAssignmentId,
    async (req, res, next) => {
        try {
            const assignment = await getAssignmentById(req.params.assignmentId)

            res.status(200).send(assignment)
        } catch (error) {
            next(error)
        }
})

/**
 * PATCH /assignments/{assignmentId} - Route to update the specified assignment's information
 */
router.patch('/:assignmentId',
    requireAuthentication,
    validateAssignmentId,
    authorizeAssignmentAccess,
    async (req, res, next) => {
        try {
            await updateAssignmentById(req.params.assignmentId, req)

            res.status(200).send()
        } catch (error) {
            next(error)
        }
})

/**
 * DELETE /assignments/{assignmentId} - Route to delete the specified course
 */
router.delete('/:assignmentId',
    requireAuthentication,
    validateAssignmentId,
    authorizeAssignmentAccess,
    async (req, res, next) => {
        try {
            await deleteAssignmentById(req.params.assignmentId)

            res.status(204).send()
        } catch (error) {
            next(error)
        }
})

/**
 * GET /assignments/{assignmentId}/submissions -
 */
router.get('/:assignmentId/submissions', async (req, res, next) => {
    // TODO:
})

/**
 * POST /assignments/{assignmentId}/submissions -
 */
router.post('/:assignmentId/submissions', async (req, res, next) => {
    // TODO:
})

module.exports = router