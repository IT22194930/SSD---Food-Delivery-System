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
const {
  validate,
  sanitizeParams,
  registerSchema,
  loginSchema,
  googleAuthSchema,
  updateUserSchema,
  paramIdSchema,
  paramEmailSchema
} = require("../middleware/validation");

const router = express.Router();

//  Public Routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/google-auth", validate(googleAuthSchema), googleAuth);

//  Protected Routes
router.get("/users/:id", sanitizeParams, validate(paramIdSchema, 'params'), authMiddleware, getUserById);
router.get("/user/:email", sanitizeParams, validate(paramEmailSchema, 'params'), getUserByEmail);
router.get("/users", authMiddleware, getAllUsers);
router.patch("/users/:id", sanitizeParams, validate(paramIdSchema, 'params'), validate(updateUserSchema), authMiddleware, updateUser);
router.delete("/users/:id", sanitizeParams, validate(paramIdSchema, 'params'), authMiddleware, deleteUser);

module.exports = router;
