const express = require('express');
const { signup, login, getProducts, createOrder } = require('../controllers/userController');
const { authenticateToken } = require('../utils/authenticate');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/products', authenticateToken, getProducts);
router.post('/order', authenticateToken, createOrder);

module.exports = router;
