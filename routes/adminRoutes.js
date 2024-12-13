const express = require('express');
const { signup,login,getProfile, getUsers, toggleBlockUser, toggleStatus, deleteUser, addProduct } = require('../controllers/adminController');
const { authenticateToken } = require('../utils/authenticate');

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.get('/users', authenticateToken, getUsers);
router.post('/products', authenticateToken, addProduct);
router.put('/toggle-block/:userId', authenticateToken, toggleBlockUser);
router.put('/status/:userId', authenticateToken, toggleStatus);
router.delete('/delete/:userId', authenticateToken, deleteUser);


module.exports = router;
