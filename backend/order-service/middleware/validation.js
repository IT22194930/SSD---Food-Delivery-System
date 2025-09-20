const joi = require("joi");
const mongoSanitize = require("mongo-sanitize");

// Sanitize input function
const sanitizeInput = (data) => {
  return mongoSanitize(data);
};

// Common validation schemas
const objectIdSchema = joi.string().regex(/^[0-9a-fA-F]{24}$/).required();

// Order validation schemas
const createOrderSchema = joi.object({
  restaurant: objectIdSchema,
  items: joi.array().items(
    joi.object({
      menuItem: objectIdSchema,
      quantity: joi.number().integer().min(1).max(100).required()
    })
  ).min(1).required(),
  deliveryAddress: joi.object({
    street: joi.string().min(1).max(200).required(),
    city: joi.string().min(1).max(100).required(),
    postalCode: joi.string().min(3).max(20).required(),
    coordinates: joi.object({
      lat: joi.number().min(-90).max(90).required(),
      lng: joi.number().min(-180).max(180).required()
    }).optional()
  }).required(),
  totalAmount: joi.number().positive().precision(2).required(),
  deliveryFee: joi.number().min(0).precision(2).default(0),
  notes: joi.string().max(500).optional()
});

const updateOrderStatusSchema = joi.object({
  status: joi.string().valid(
    "Pending", 
    "Confirmed", 
    "Preparing", 
    "Ready", 
    "Out for Delivery", 
    "Delivered", 
    "Cancelled"
  ).required()
});

// Cart validation schemas
const addToCartSchema = joi.object({
  menuItemId: objectIdSchema,
  quantity: joi.number().integer().min(1).max(100).default(1),
  restaurantId: objectIdSchema
});

const updateCartItemSchema = joi.object({
  menuItemId: objectIdSchema,
  quantity: joi.number().integer().min(0).max(100).required(),
  restaurantId: objectIdSchema
});

// Parameter validation schemas
const paramIdSchema = joi.object({
  id: objectIdSchema
});

const cartParamsSchema = joi.object({
  menuItemId: objectIdSchema,
  restaurantId: objectIdSchema
});

const restaurantIdSchema = joi.object({
  restaurantId: objectIdSchema
});

// Query validation schemas
const orderQuerySchema = joi.object({
  status: joi.string().valid(
    "Pending", 
    "Confirmed", 
    "Preparing", 
    "Ready", 
    "Out for Delivery", 
    "Delivered", 
    "Cancelled"
  ).optional(),
  restaurant: objectIdSchema.optional(),
  customer: objectIdSchema.optional(),
  limit: joi.number().integer().min(1).max(100).default(10),
  page: joi.number().integer().min(1).default(1),
  sortBy: joi.string().valid("createdAt", "totalAmount", "status").default("createdAt"),
  sortOrder: joi.string().valid("asc", "desc").default("desc")
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
  createOrderSchema,
  updateOrderStatusSchema,
  addToCartSchema,
  updateCartItemSchema,
  paramIdSchema,
  cartParamsSchema,
  restaurantIdSchema,
  orderQuerySchema
};
