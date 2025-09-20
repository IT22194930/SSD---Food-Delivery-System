const express = require("express");
const {
  register,
  login,
  googleAuth,
  getUserById,
  getUserByEmail,
  getAllUsers,
  updateUser,
  deleteUser,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { authLimiter, registerLimiter, oauthLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

//  Public Routes with Rate Limiting
router.post("/register", registerLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google-auth", oauthLimiter, googleAuth);

//  Protected Routes
router.get("/users/:id", authMiddleware, getUserById);
router.get("/user/:email", getUserByEmail);
router.get("/users", authMiddleware, getAllUsers);
router.patch("/users/:id", authMiddleware, updateUser);
router.delete("/users/:id", authMiddleware, deleteUser);

module.exports = router;
