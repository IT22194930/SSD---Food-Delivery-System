const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const gatewayRoutes = require("./routes/gatewayRoutes");
const dns = require("dns");
const net = require("net");
const url = require("url");

dotenv.config();
const app = express();
app.disable("x-powered-by");

// Remove Server header from all responses
app.use((req, res, next) => {
  res.removeHeader('Server');
  next();
});

// Strict CSP using helmet (no unsafe-inline, no unsafe-eval, no wildcards)
// Apply helmet with strict CSP (removes unsafe-inline & unsafe-eval)
// Use helmet for security headers (core protections)
app.use(
  helmet({
    frameguard: { action: "deny" },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    hidePoweredBy: true,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'"],
        "font-src": ["'self'"],
        "img-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    expectCt: {
      maxAge: 86400,
      enforce: true,
    },
    referrerPolicy: { policy: "no-referrer" },
  })
);

// Explicitly enable X-Content-Type-Options: nosniff
app.use(helmet.noSniff());


// CORS configuration
const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:3030"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use("/", gatewayRoutes);

// Custom error handler
app.use(function (err, req, res, next) {
  const errorId = Date.now();
  
  // Log full error details server-side only
  console.error(`Error [${errorId}]:`, err);
  
  // Security headers are already set by helmet, but ensuring for error responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(500).json({
    error: "An unexpected error occurred.",
    reference: errorId,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));