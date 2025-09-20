const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const deliveryRoutes = require("./routes/deliveryRoutes");

dotenv.config();
const app = express();

app.disable("x-powered-by");

connectDB();

app.use(express.json());
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

app.use("/api/deliveries", deliveryRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Delivery Service running on port ${PORT}`));
