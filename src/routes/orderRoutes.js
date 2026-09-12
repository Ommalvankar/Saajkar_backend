const express = require("express");

const router = express.Router();

const { protect, admin } = require("../middleware/authMiddleware");

const {
    createOrder,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus
} = require("../controllers/orderController");


// ===============================
// CUSTOMER ROUTES
// ===============================

// COD order
router.post("/", protect, createOrder);

// Create Razorpay payment order
router.post(
    "/create-razorpay-order",
    protect,
    createRazorpayOrder
);

// Verify Razorpay payment
router.post(
    "/verify-payment",
    protect,
    verifyRazorpayPayment
);

// Get logged-in user's orders
router.get("/my", protect, getMyOrders);

// Get single order
router.get("/:id", protect, getOrderById);


// ===============================
// ADMIN ROUTES
// ===============================

// Get all orders
router.get("/", protect, admin, getAllOrders);

// Update order status
router.put(
    "/:id/status",
    protect,
    admin,
    updateOrderStatus
);


module.exports = router;
