const { Router } = require('express')
const { requireAuthentication } = require('../lib/auth')
const { insertNewCourse, getCoursebyId, updateCoursebyId, validateCourse, deleteCoursebyId } = require('../models/course')

const router = Router()

/**
 * POST /courses - Route to create a new course
 */
router.post('/', requireAuthentication, validateCourse, async function(req, res, next) {
    if (req.role === "admin") {
        try {
            const id = await insertNewCourse(req.body)
            res.status(201).send({ _id: id })
        } catch (error) {
            next(error)
        }
    } else {
        res.status(403).send({
            error: "Invalid authorization for creating this course."
        })
    }
})

/**
 * GET /courses/{id} - Route to fetch a specific course information
 */
router.get('/:courseId', async function(req, res, next) {
    try {
        const course = await getCoursebyId(req.params.courseId)

        if (course) {
            res.status(200).send(course)
        } else {
           res.status(404).send({
                error: "Specified course does not exist."
           })
        }
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /courses/{id} - Route to update a specific course information
 */
router.put('/:courseId', requireAuthentication, validateCourse, async function(req, res, next) {
    try {
        const course = await getCoursebyId(req.params.courseId)

        if (course) {
            if (req.role === "admin" || (req.role === "instructor" && req.user === course.instructorId.toString())) {
                const result = await updateCoursebyId(req.params.courseId, req)

                res.status(200).send()
            } else {
                return res.status(403).send({
                    error: "Invalid authorization to update the course."
                })
            }
        } else {
           res.status(404).send({
                error: "Specified course does not exist."
           })
        }
    } catch (error) {
        next(error)
    }
})

/**
 * DELETE /courses/{id} - Route to delete a specific course
 */
router.delete('/:courseId', requireAuthentication, async function(req, res, next) {
    if (req.role === "admin") {
        try {
            const deletedCount = await deleteCoursebyId(req.params.courseId)
            
            if (deletedCount) {
                res.status(204).send()
            } else {
               res.status(404).send({
                    error: "Specified course does not exist."
               })
            }
        } catch (error) {
            next(error)
        }
    } else {
        res.status(403).send({
            error: "Invalid authorization for deleting the course."
        })
    }
})

module.exports = router