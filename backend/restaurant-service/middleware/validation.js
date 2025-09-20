const joi = require("joi");
const mongoSanitize = require("mongo-sanitize");

// Sanitize input function
const sanitizeInput = (data) => {
  return mongoSanitize(data);
};

// Common validation schemas
const objectIdSchema = joi.string().regex(/^[0-9a-fA-F]{24}$/).required();
const nameSchema = joi.string().min(1).max(100).required();
const descriptionSchema = joi.string().max(1000).optional();
const priceSchema = joi.number().positive().precision(2).required();

// Restaurant validation schemas
const createRestaurantSchema = joi.object({
  name: nameSchema,
  description: descriptionSchema,
  address: joi.string().max(500).required(),
  phone: joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
  email: joi.string().email().required(),
  cuisine: joi.string().max(100).required(),
  openingHours: joi.string().max(200).optional(),
  imageUrl: joi.string().uri().optional(),
  latitude: joi.number().min(-90).max(90).optional(),
  longitude: joi.number().min(-180).max(180).optional()
});

const updateRestaurantSchema = joi.object({
  name: joi.string().min(1).max(100).optional(),
  description: joi.string().max(1000).optional(),
  address: joi.string().max(500).optional(),
  phone: joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  email: joi.string().email().optional(),
  cuisine: joi.string().max(100).optional(),
  openingHours: joi.string().max(200).optional(),
  imageUrl: joi.string().uri().optional(),
  latitude: joi.number().min(-90).max(90).optional(),
  longitude: joi.number().min(-180).max(180).optional()
});

// Menu item validation schemas
const createMenuItemSchema = joi.object({
  name: nameSchema,
  price: priceSchema,
  category: joi.string().min(1).max(50).required(),
  description: descriptionSchema,
  imageUrl: joi.string().uri().optional(),
  isAvailable: joi.boolean().default(true)
});

const updateMenuItemSchema = joi.object({
  name: joi.string().min(1).max(100).optional(),
  price: joi.number().positive().precision(2).optional(),
  category: joi.string().min(1).max(50).optional(),
  description: joi.string().max(1000).optional(),
  imageUrl: joi.string().uri().optional(),
  isAvailable: joi.boolean().optional()
});

// Parameter validation schemas
const paramIdSchema = joi.object({
  id: objectIdSchema
});

const restaurantIdSchema = joi.object({
  restaurantId: objectIdSchema
});

const menuItemIdSchema = joi.object({
  menuItemId: objectIdSchema
});

// Query validation schemas
const searchQuerySchema = joi.object({
  q: joi.string().max(100).optional(),
  cuisine: joi.string().max(50).optional(),
  minPrice: joi.number().min(0).optional(),
  maxPrice: joi.number().min(0).optional(),
  limit: joi.number().integer().min(1).max(100).default(10),
  page: joi.number().integer().min(1).default(1)
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
  createRestaurantSchema,
  updateRestaurantSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  paramIdSchema,
  restaurantIdSchema,
  menuItemIdSchema,
  searchQuerySchema
};
