const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const services = require("../config/services");

const router = express.Router();

const { URL } = require("url");

// SSRF Protection: Only allow proxying to known internal services
const allowedServiceHosts = Object.values(services).map(serviceUrl => {
  try {
    return new URL(serviceUrl).host;
  } catch (e) {
    return null;
  }
}).filter(Boolean);

// Function to Proxy Requests
const createServiceProxy = (serviceUrl) => {
  let targetHost;
  try {
    targetHost = new URL(serviceUrl).host;
  } catch (e) {
    targetHost = null;
  }
  if (!allowedServiceHosts.includes(targetHost)) {
    throw new Error("SSRF protection: Target host is not allowed.");
  }
  return createProxyMiddleware({
    target: serviceUrl,
    changeOrigin: true,
    timeout: 60000,
    proxyTimeout: 60000,
    onProxyReq: (proxyReq, req) => {
      if (req.headers.authorization) {
        proxyReq.setHeader("Authorization", req.headers.authorization);
      }
    },
  });
};

// API Gateway Routes
router.use("/api/auth", createServiceProxy(services.authService));
router.use("/api/restaurants", createServiceProxy(services.restaurantService));
router.use("/api/menu", createServiceProxy(services.restaurantMenuService));
router.use("/api/orders", createServiceProxy(services.orderService));
router.use("/api/cart", createServiceProxy(services.cartService));
router.use("/api/deliveries", createServiceProxy(services.deliveryService));
router.use("/api/payment", createServiceProxy(services.paymentService));
router.use(
  "/api/notifications",
  createServiceProxy(services.notificationService)
);

module.exports = router;
