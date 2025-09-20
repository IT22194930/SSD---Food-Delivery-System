const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const connectDB = require("./config/db");
const paymentRouter = require("./routes/paymentRoute");

dotenv.config();
connectDB();

const app = express();
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

// Custom CSP using helmet
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

app.use("/api/payment", paymentRouter);

// Custom error handler to avoid leaking sensitive info
app.use(function (err, req, res, next) {
  const errorId = Date.now();
  console.error(`Error [${errorId}]:`, err);
  res.status(500).json({
    error: "An unexpected error occurred.",
    reference: errorId,
  });
});

app.listen(process.env.PORT, () =>
  console.log(`Payment Service running on port ${process.env.PORT}`)
);
