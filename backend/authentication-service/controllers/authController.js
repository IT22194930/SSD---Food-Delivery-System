const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { sanitizeInput } = require("../middleware/validation");
const { logAuthSuccess, logAuthFailure, logOAuthEvent, logSecurityEvent } = require("../utils/logger");

//  Register a New User
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate password
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Ensure `role` is valid
    if (
      !["customer", "restaurant_admin", "delivery_personnel", "admin"].includes(
        role
      )
    ) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Check if email already exists - using $eq operator to prevent NoSQL injection
    const existingUser = await User.findOne({ email: { $eq: email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password with a higher salt rounds for better security
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with hashed password
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      address: req.body.address,
      phone: req.body.phone,
      photoUrl: req.body.photoUrl,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    };

    const result = await User.create(userData);

    // Generate JWT token
    const token = jwt.sign(
      { id: result._id, role: result.role },
      process.env.JWT_SECRET
    );

    // Send response with token
    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: result._id,
        name: result.name,
        email: result.email,
        role: result.role,
        address: result.address,
        phone: result.phone,
        photoUrl: result.photoUrl,
        latitude: result.latitude,
        longitude: result.longitude,
      },
      token,
    });

    // Log successful registration
    logAuthSuccess(result._id, result.email, 'local_registration');
  } catch (error) {
    console.error("Error registering user:", error);
    logSecurityEvent('registration_error', {
      email: req.body.email,
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(500).json({ message: "Error registering user" });
  }
};

//  Login User and Generate JWT Token
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email - using $eq operator to prevent NoSQL injection
    const user = await User.findOne({ email: { $eq: email } });
    if (user) {
      console.log("User details:", {
        id: user._id,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
      });
    }

    if (!user) {
      logAuthFailure(email, 'user_not_found', req.ip, req.get('User-Agent'));
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logAuthFailure(email, 'invalid_password', req.ip, req.get('User-Agent'));
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        photoUrl: user.photoUrl,
        latitude: user.latitude,
        longitude: user.longitude,
      },
    });

    // Log successful login
    logAuthSuccess(user._id, user.email, 'local_login');
  } catch (error) {
    console.error("Error during login:", error);
    logSecurityEvent('login_error', {
      email: req.body.email,
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(500).json({ message: "Login failed" });
  }
};

//  Get User by ID
const getUserById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findOne({ _id: { $eq: req.params.id } }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

//  Get User by Email
const getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email || req.query.email;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Sanitize and use $eq operator to prevent NoSQL injection
    const sanitizedEmail = sanitizeInput(email);
    const user = await User.findOne({ email: { $eq: sanitizedEmail } });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

//  Get All Users (Admin Only)
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

//  Update User
const updateUser = async (req, res) => {
  try {
    console.log("Update user request received:");
    console.log("User ID to update:", req.params.id);
    console.log("Request body:", req.body);
    console.log("Requesting user:", req.user);
    
    const { name, email, role, address, phone, photoUrl } = req.body;
    
    // Check if the requesting user is an admin or updating their own profile
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = req.user.id === req.params.id;
    
    if (!isAdmin && !isOwnProfile) {
      console.log("Permission denied: User is not admin and not updating own profile");
      return res.status(403).json({ 
        message: "Permission denied. You can only update your own profile or must be an admin." 
      });
    }
    
    // If not admin, prevent role changes
    if (!isAdmin && role && role !== req.user.role) {
      console.log("Permission denied: Non-admin trying to change role");
      return res.status(403).json({ 
        message: "Permission denied. Only admins can change user roles." 
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: { $eq: req.params.id } },
      { name, email, role, address, phone, photoUrl },
      { new: true }
    ).select('-password'); // Don't return password

    if (!updatedUser) {
      console.log("User not found with ID:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User updated successfully:", updatedUser._id);
    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

//  Delete User
const deleteUser = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const deletedUser = await User.findOneAndDelete({ _id: { $eq: req.params.id } });
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
};

//  Google Login/Register
const googleAuth = async (req, res) => {
  try {
    const { name, email, photoUrl, role = "customer" } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if user already exists - using $eq operator to prevent NoSQL injection
    let user = await User.findOne({ email: { $eq: email } });
    
    if (user) {
      // User exists, update their info if needed and return login response
      console.log("Existing Google user found:", { id: user._id, email: user.email });
      
      if (photoUrl && user.photoUrl !== photoUrl) {
        user.photoUrl = photoUrl;
        await user.save();
        console.log("Updated photoUrl for existing user");
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET
      );

      return res.json({
        message: "Google login successful",
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          address: user.address,
          phone: user.phone,
          photoUrl: user.photoUrl,
          latitude: user.latitude,
          longitude: user.longitude,
        },
      });

      // Log Google OAuth event for existing user
      logOAuthEvent('google_login_success', email, 'google', { userId: user._id });
    } else {
      // User doesn't exist, create new user
      // Hash a placeholder password for Google users
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash("google_auth_placeholder", salt);
      
      const userData = {
        name,
        email,
        password: hashedPassword, // Hashed placeholder password for Google users
        role,
        photoUrl,
        // Optional fields from request body
        address: req.body.address,
        phone: req.body.phone,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      };

      console.log("Creating new Google user:", { name, email, role });
      const result = await User.create(userData);
      console.log("Google user created successfully with ID:", result._id);

      // Generate JWT token
      const token = jwt.sign(
        { id: result._id, role: result.role },
        process.env.JWT_SECRET
      );

      // Send response with token
      return res.status(201).json({
        message: "Google registration successful",
        user: {
          _id: result._id,
          name: result.name,
          email: result.email,
          role: result.role,
          address: result.address,
          phone: result.phone,
          photoUrl: result.photoUrl,
          latitude: result.latitude,
          longitude: result.longitude,
        },
        token,
      });

      // Log Google OAuth event for new user
      logOAuthEvent('google_registration_success', email, 'google', { userId: result._id });
    }
  } catch (error) {
    console.error("Error with Google authentication:", error);
    logSecurityEvent('google_oauth_error', {
      email: req.body.email,
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(500).json({ message: "Google authentication failed" });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  getUserById,
  getUserByEmail,
  getAllUsers,
  updateUser,
  deleteUser,
};
