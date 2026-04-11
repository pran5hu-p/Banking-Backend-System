const express = require('express');
const {authMiddleware} = require('../middleware/auth.middleware.js');
const {createAccount, getuseraccounts, getAccountBalance} = require('../controllers/account.controller.js');
const router = express.Router();

router.post('/', authMiddleware, createAccount)
router.get("/", authMiddleware, getuseraccounts)
router.get("/balance/:accountId", authMiddleware, getAccountBalance)

module.exports = router;