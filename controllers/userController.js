const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

// User Signup
exports.signup = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password, location } = req.body;

       
        const userLocation = location || { type: 'Point', coordinates: [0, 0] }; 

        const existingUser = await User.findOne({
            $or: [{ email }, { phoneNumber }],
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'User with the same email or phone number already exists',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstName,
            lastName,
            email,
            phoneNumber,
            password: hashedPassword,
            location: userLocation,
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error signing up user', error: error.message });
    }
};



// User Login
exports.login = async (req, res) => {
    try {
        const { email, phoneNumber, password } = req.body;

       
        if (!email && !phoneNumber) {
            return res.status(400).json({ message: 'Email or phone number is required.' });
        }

        const user = await User.findOne(email ? { email } : { phoneNumber });

        if (!user) {
            return res.status(404).json({ message: 'User does not exist.' });
        }
        if (user.status !== 'approved') {
            return res.status(403).json({ message: 'User is not approved by the admin.' });
        }
        if (user.isBlocked) {
            return res.status(403).json({ message: 'User is blocked.' });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: user._id, location: user.location },
            'secretkey', 
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login successful.', token });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};



// Get Products Nearby
exports.getProducts = async (req, res) => {
    try {
        
        const { latitude, longitude } = req.query;
        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const coordinates = [parseFloat(longitude), parseFloat(latitude)];

        if (coordinates.length !== 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])) {
            return res.status(400).json({ message: 'Invalid coordinates' });
        }

        const products = await Product.find({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates },
                    $maxDistance: 10000, 
                },
            },
        });

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};




// Create Order
exports.createOrder = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ message: 'Product not found' });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        product.stock -= quantity;
        await product.save();

        const newOrder = new Order({
            userId: req.user.id,
            productId,
            quantity,
        });
        await newOrder.save();

        res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
    } catch (error) {
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
};