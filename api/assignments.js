/**
 * API sub-router for assignment collection endpoints.
 */

const { Router } = require('express')
const { validateCourseId, validateAssignmentId } = require('../lib/validation')
const { 
    requireAuthentication, 
    authorizeCourseRelatedAccess, 
    authorizeAssignmentAccess,
    authorizeSubmissionAccess
} = require('../lib/auth')
const { 
    validateAssignmentBody, 
    insertNewAssignment, 
    getAssignmentById, 
    updateAssignmentById, 
    deleteAssignmentById, 
    insertNewSubmission,
    upload,
    fetchAssignmentSubmissions
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
 * GET /assignments/{assignmentId}/submissions - Route to get all the submissions of the specified assignment 
 */
router.get('/:assignmentId/submissions', 
    requireAuthentication,
    validateAssignmentId,
    authorizeAssignmentAccess,
    async (req, res, next) => {
    try {
        const result = await fetchAssignmentSubmissions(req.params.assignmentId)
        
        res.status(200).send(result)
    } catch (error) {
        next(error)
    }

})

/**
 * POST /assignments/{assignmentId}/submissions - Route to post a new submission by an authorized user
 */
router.post('/:assignmentId/submissions', 
    requireAuthentication,
    validateAssignmentId,
    authorizeSubmissionAccess,
    upload.single("file"),
    async (req, res, next) => {
    try {
        const id = await insertNewSubmission(req.params.assignmentId, req)
        
        res.status(200).send(id)
    } catch (error) {
        next(error)
    }
})

module.exports = router