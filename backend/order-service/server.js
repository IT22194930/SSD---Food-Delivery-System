const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");

dotenv.config();
const app = express();

connectDB();

app.disable("x-powered-by");

app.use(express.json());
// Use helmet for security headers
app.use(
  helmet({
    frameguard: { action: "deny" },
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    contentTypeOptions: true,
    hidePoweredBy: true,
  })
);

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'"],
      "font-src": ["'self'"],
      "img-src": ["'self'"],
      "frame-ancestors": ["'none'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
    },
  })
);
// Vulnerability 1 - CORS configuration
const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:3030"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // allow cookies/auth headers if needed
  })
);
//-----------------------------------------------//

app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

// Custom error handler to avoid leaking sensitive info
app.use(function (err, req, res, next) {
  const errorId = Date.now();
  console.error(`Error [${errorId}]:`, err);
  res.status(500).json({
    error: "An unexpected error occurred.",
    reference: errorId,
  });
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
