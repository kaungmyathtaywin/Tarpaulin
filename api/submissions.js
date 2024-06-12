const { Router } = require('express')

const express = require('express');
const router = Router()
const path = require('path');
const { validateSubmissionFields, patchSubmissionById } = require('../models/submission');
const { requireAuthentication, authorizeAssignmentAccess } = require('../lib/auth');

/**
 * PATCH /submissions/{submissionId}/submissions - Route to patch a submission by an authorized user
 */
router.patch('/:submissionId',
    requireAuthentication,
    validateSubmissionFields,
    authorizeAssignmentAccess,
    async (req, res, next) => {
        try {
            await patchSubmissionById(req.params.submissionId, req)
            
            res.status(201).send()
        } catch (error) {
            next(error)
        }

})

/**
 * GET /submissions/media/submissions - Route to download a submission
 */
router.use('/media/submissions', express.static(path.join(__dirname, '../media/submissions')));

module.exports = router