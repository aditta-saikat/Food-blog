const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes require auth
router.get('/:id', verifyToken, userController.getUser);
router.put('/:id',  verifyToken, userController.updateUser);
router.delete('/:id', verifyToken, userController.deleteUser);
router.get('/',  verifyToken, userController.getAllUsers); // admin only
router.get('/me', verifyToken, userController.getCurrentUser);



module.exports = router;