const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Admin Login
exports.signup = async (req, res) => {
  try {
    const { firstName, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ firstName, email, password: hashedPassword });
    await newAdmin.save();
    res.status(201).json({ message: "Admin registered successfully!" });
  } catch (error) {
    console.error("Error during signup:", error);
    res
      .status(500)
      .json({ message: "Error signing up admin", error: error.message });
  }
};

// Admin Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: admin._id }, "secretkey", { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in admin", error });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const admin = await Admin.findById(adminId).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json(admin);
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res
      .status(500)
      .json({ message: "Error fetching admin profile", error: error.message });
  }
};
// Get Users
exports.getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const query = search
      ? {
          $or: [
            { firstName: new RegExp(search, "i") },
            { email: new RegExp(search, "i") },
            { phoneNumber: new RegExp(search, "i") },
          ],
        }
      : {};
    const users = await User.find(query);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

// Toggle Block/Unblock User
exports.toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    const status = user.isBlocked ? "blocked" : "unblocked";
    res.status(200).json({ message: `User ${status} successfully`, user });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error toggling user block status",
        error: error.message,
      });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.query;

    if (!["approve", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ message: 'Invalid action. Use "approve" or "reject".' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = action === "approve" ? "approved" : "rejected";

    await user.save();

    res.status(200).json({ message: `User ${action}d successfully`, user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating user status", error: error.message });
  }
};
//  Delete User By Id
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};


exports.getUserProductData = async (req, res) => {
  try {
    const data = await User.aggregate([
      {
        $lookup: {
          from: "products", 
          localField: "_id",
          foreignField: "userId", 
          as: "userProducts",
        },
      },
      {
        $unwind: "$userProducts",
      },
    ]);
    res.status(200).json(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching data", error: error.message });
  }
};

// Add Products
exports.addProduct = async (req, res) => {
  try {
    const { name, stock, price, location } = req.body;

    if (!name || !stock || !price || !location || !location.coordinates) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newProduct = new Product({
      name,
      stock,
      price,
      location: {
        type: "Point",
        coordinates: location.coordinates,
      },
    });

    await newProduct.save();

    res
      .status(201)
      .json({ message: "Product added successfully!", product: newProduct });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding product", error: error.message });
  }
};

//Get Products

exports.getProducts = async (req, res) => {
  try {
    const { coordinates } = req.user.location;
    const products = await Product.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates },
          $maxDistance: 10000, // 10 km
        },
      },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
};
