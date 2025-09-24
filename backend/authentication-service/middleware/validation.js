const joi = require("joi");
const mongoSanitize = require("mongo-sanitize");

// Sanitize input function
const sanitizeInput = (data) => {
  return mongoSanitize(data);
};

// Common validation schemas
const emailSchema = joi.string().email().required();
const passwordSchema = joi.string().min(6).required();
const nameSchema = joi.string().min(1).max(100).required();
const roleSchema = joi.string().valid("customer", "restaurant_admin", "delivery_personnel", "admin").required();
const objectIdSchema = joi.string().regex(/^[0-9a-fA-F]{24}$/).required();

// Registration validation schema
const registerSchema = joi.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
  address: joi.string().max(500).optional(),
  phone: joi.string().pattern(/^[\+]?[\d]{1,15}$/).optional(),
  photoUrl: joi.string().uri().optional(),
  latitude: joi.number().min(-90).max(90).optional(),
  longitude: joi.number().min(-180).max(180).optional()
});

// Login validation schema
const loginSchema = joi.object({
  email: emailSchema,
  password: joi.string().required()
});

// Google auth validation schema
const googleAuthSchema = joi.object({
  name: nameSchema,
  email: emailSchema,
  photoUrl: joi.string().uri().optional(),
  role: joi.string().valid("customer", "restaurant_admin", "delivery_personnel", "admin").default("customer"),
  address: joi.string().max(500).optional(),
  phone: joi.string().pattern(/^[\+]?[\d]{1,15}$/).optional(),
  latitude: joi.number().min(-90).max(90).optional(),
  longitude: joi.number().min(-180).max(180).optional()
});

// Update user validation schema
const updateUserSchema = joi.object({
  name: joi.string().min(1).max(100).optional(),
  email: joi.string().email().optional(),
  role: joi.string().valid("customer", "restaurant_admin", "delivery_personnel", "admin").optional(),
  address: joi.string().max(500).optional(),
  phone: joi.string().pattern(/^[\+]?[\d]{1,15}$/).optional(),
  photoUrl: joi.string().uri().optional(),
  latitude: joi.number().min(-90).max(90).optional(),
  longitude: joi.number().min(-180).max(180).optional()
});

// Parameter validation schema
const paramIdSchema = joi.object({
  id: objectIdSchema
});

const paramEmailSchema = joi.object({
  email: emailSchema
});

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    // Sanitize the input first
    if (req[property]) {
      req[property] = sanitizeInput(req[property]);
    }

    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        message: "Validation error",
        errors: errorMessages
      });
    }

    // Replace the request property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

// Middleware to sanitize ObjectId parameters
const sanitizeParams = (req, res, next) => {
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  next();
};

module.exports = {
  validate,
  sanitizeParams,
  sanitizeInput,
  registerSchema,
  loginSchema,
  googleAuthSchema,
  updateUserSchema,
  paramIdSchema,
  paramEmailSchema
};
