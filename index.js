const express = require("express");
const app = express();
const mongoose = require("./config/database");
const cron = require("node-cron");

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const Product = require("./models/productModel");

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Application API");
});

const notifyLowStock = async () => {
  const lowStockProducts = await Product.find({ stock: { $lt: 10 } });
  if (lowStockProducts.length > 0) {
    console.log("Low stock notification:", lowStockProducts);
  }
};

cron.schedule("* * * * *", notifyLowStock);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
