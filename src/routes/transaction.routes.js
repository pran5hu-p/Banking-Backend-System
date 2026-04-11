const {Router} = require('express');
const {authMiddleware, systemAuthMiddleware} = require('../middleware/auth.middleware.js');
const transactionController = require('../controllers/transaction.controller.js');

const transactionRoutes = Router();

transactionRoutes.post("/", authMiddleware, transactionController.createTransaction)

transactionRoutes.post("/system/initial-funds", systemAuthMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;