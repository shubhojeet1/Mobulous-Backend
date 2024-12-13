const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://jeetduke1234:1234@mobulous.e8a18.mongodb.net/?retryWrites=true&w=majority&appName=mobulous",
    {
      // useNewUrlParser: true,
      // useUnifiedTopology: true
    }
  )
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

mongoose.connection.on("connected", () => {
  console.log("Mongoose default connection is open");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose default connection is disconnected");
});

module.exports = mongoose;
