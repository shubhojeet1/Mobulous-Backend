const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const token =
    req.header("Authorization") && req.header("Authorization").split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied, no token provided" });
  }

  jwt.verify(token, "secretkey", (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    console.log("Decoded Token:", decoded);
    req.admin = decoded;
    req.user = decoded;

    next();
  });
};

module.exports = { authenticateToken };
