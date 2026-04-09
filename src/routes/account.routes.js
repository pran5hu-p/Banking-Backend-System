const express = require('express');
const {authMiddleware} = require('../middleware/auth.middleware.js');
const {createAccount} = require('../controllers/account.controller.js');
const router = express.Router();

router.post('/', authMiddleware, createAccount)

module.exports = router;