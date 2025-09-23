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
// Use helmet for security headers (core protections)
app.use(
  helmet({
    frameguard: { action: "deny" },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
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

function validateUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl);

    // Allow only HTTPS (or http if needed for internal)
    if (!["https:", "http:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }

    // Block localhost and private networks
    const hostname = parsed.hostname;
    const blockedHosts = ["localhost", "127.0.0.1", "::1"];
    if (blockedHosts.includes(hostname)) {
      throw new Error("Blocked host");
    }

    // Block private IP ranges
    const privateRanges = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[0-1])\./];
    if (privateRanges.some((r) => r.test(hostname))) {
      throw new Error("Private IP not allowed");
    }

    return true;
  } catch (err) {
    return false;
  }
}

// Middleware to check any incoming URL param/body field called "url"
app.use((req, res, next) => {
  const userUrl = req.body?.url || req.query?.url;
  if (userUrl && !validateUrl(userUrl)) {
    return res.status(400).json({ error: "Invalid or blocked URL" });
  }
  next();
});

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