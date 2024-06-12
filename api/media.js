const { Router } = require('express')
const express = require('express')
const path = require('path')

const router = Router()

router.use('/submissions', express.static(path.join(__dirname, '../media/submissions')));

module.exports = router