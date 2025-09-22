const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const helmet = require("helmet");
const dns = require("dns");
const net = require("net");
const url = require("url");

dotenv.config();
const app = express();

connectDB();
app.disable("x-powered-by");
app.use(express.json());

// ✅ Remove Server header
app.use((req, res, next) => {
  res.removeHeader("Server");
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



// Middleware to check any incoming URL param/body field called "url"
app.use((req, res, next) => {
  const userUrl = req.body?.url || req.query?.url;
  if (userUrl && !validateUrl(userUrl)) {
    return res.status(400).json({ error: "Invalid or blocked URL" });
  }
  next();
});

// ✅ Restrictive CORS
const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:3030"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(
          new Error("The CORS policy does not allow this origin."),
          false
        );
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);

// ✅ Error handler
app.use((err, req, res, next) => {
  const errorId = Date.now();
  console.error(`Error [${errorId}]:`, err);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.status(500).json({
    error: "An unexpected error occurred.",
    reference: errorId,
  });
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
