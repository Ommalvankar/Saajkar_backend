const crypto = require("crypto");
const Razorpay = require("razorpay");

const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/product");

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ======================================================
// CREATE COD ORDER
// POST /api/orders
// ======================================================

exports.createOrder = async (req, res) => {
    try {
        const {
            shippingAddress,
            paymentMethod,
            deliveryCharges = 0
        } = req.body;

        if (paymentMethod !== "COD") {
            return res.status(400).json({
                success: false,
                message: "Use the Razorpay payment endpoint for online payments"
            });
        }

        // Find user's cart
        const cart = await Cart.findOne({
            user: req.user._id
        }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        // Check stock
        for (const item of cart.items) {
            if (!item.product) {
                return res.status(400).json({
                    success: false,
                    message: "A product in your cart is no longer available"
                });
            }

            if (item.quantity > item.product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `${item.product.name} has only ${item.product.stock} item(s) left in stock`
                });
            }
        }

        // Prepare order items
        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.discountPrice || item.product.price
        }));

        // Calculate product subtotal
        const subtotal = orderItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        // Calculate final total
        const finalDeliveryCharges = Number(deliveryCharges) || 0;
        const totalAmount = subtotal + finalDeliveryCharges;

        // Reduce stock
        for (const item of cart.items) {
            item.product.stock -= item.quantity;
            await item.product.save();
        }

        // Create COD order
        const order = await Order.create({
            user: req.user._id,
            orderItems,
            shippingAddress,
            paymentMethod: "COD",
            deliveryCharges: finalDeliveryCharges,
            totalAmount,
            isPaid: false
        });

        // Clear cart
        cart.items = [];
        await cart.save();

        await order.populate("orderItems.product");

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order
        });

    } catch (error) {
        console.error("Create COD Order Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// CREATE RAZORPAY ORDER
// POST /api/orders/create-razorpay-order
// ======================================================

exports.createRazorpayOrder = async (req, res) => {
    try {
        const {
            shippingAddress,
            deliveryCharges = 0
        } = req.body;

        if (!shippingAddress) {
            return res.status(400).json({
                success: false,
                message: "Shipping address is required"
            });
        }

        // Find user's cart
        const cart = await Cart.findOne({
            user: req.user._id
        }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        // Check stock
        for (const item of cart.items) {
            if (!item.product) {
                return res.status(400).json({
                    success: false,
                    message: "A product in your cart is no longer available"
                });
            }

            if (item.quantity > item.product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `${item.product.name} has only ${item.product.stock} item(s) left in stock`
                });
            }
        }

        // Calculate subtotal
        const subtotal = cart.items.reduce((total, item) => {
            const price =
                item.product.discountPrice || item.product.price;

            return total + price * item.quantity;
        }, 0);

        const finalDeliveryCharges = Number(deliveryCharges) || 0;

        const totalAmount = subtotal + finalDeliveryCharges;

        if (totalAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order amount"
            });
        }

        // Razorpay uses paise
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100),
            currency: "INR",
            receipt: `saajkar_${Date.now()}`
        });

        res.status(200).json({
            success: true,
            message: "Razorpay order created successfully",
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
            totalAmount
        });

    } catch (error) {
        console.error("Create Razorpay Order Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// VERIFY RAZORPAY PAYMENT AND CREATE ORDER
// POST /api/orders/verify-payment
// ======================================================

exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            shippingAddress,
            deliveryCharges = 0
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment details are incomplete"
            });
        }

        // Generate expected signature
        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                `${razorpay_order_id}|${razorpay_payment_id}`
            )
            .digest("hex");

        // Verify signature
        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

        // Find user's cart
        const cart = await Cart.findOne({
            user: req.user._id
        }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        // Check stock again
        for (const item of cart.items) {
            if (!item.product) {
                return res.status(400).json({
                    success: false,
                    message: "A product in your cart is no longer available"
                });
            }

            if (item.quantity > item.product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `${item.product.name} has only ${item.product.stock} item(s) left in stock`
                });
            }
        }

        // Prepare order items
        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.discountPrice || item.product.price
        }));

        // Calculate subtotal
        const subtotal = orderItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        const finalDeliveryCharges = Number(deliveryCharges) || 0;

        const totalAmount = subtotal + finalDeliveryCharges;

        // Create paid order
        const order = await Order.create({
            user: req.user._id,
            orderItems,
            shippingAddress,
            paymentMethod: "Razorpay",
            deliveryCharges: finalDeliveryCharges,
            totalAmount,
            orderStatus: "Confirmed",
            isPaid: true,
            paidAt: new Date(),
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature
        });

        // Reduce stock
        for (const item of cart.items) {
            item.product.stock -= item.quantity;
            await item.product.save();
        }

        // Clear cart
        cart.items = [];
        await cart.save();

        await order.populate("orderItems.product");

        res.status(201).json({
            success: true,
            message: "Payment verified and order placed successfully",
            order
        });

    } catch (error) {
        console.error("Verify Razorpay Payment Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// GET LOGGED-IN USER ORDERS
// GET /api/orders/my
// ======================================================

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user._id
        })
            .populate("orderItems.product")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error("Get My Orders Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// GET SINGLE ORDER
// GET /api/orders/:id
// ======================================================

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "name email")
            .populate("orderItems.product");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Only owner or admin can view
        if (
            order.user._id.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        console.error("Get Order Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// GET ALL ORDERS - ADMIN
// GET /api/orders
// ======================================================

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email")
            .populate("orderItems.product")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error("Get All Orders Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// UPDATE ORDER STATUS - ADMIN
// PUT /api/orders/:id/status
// ======================================================

exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus } = req.body;

        const validTransitions = {
            Pending: ["Confirmed", "Cancelled"],
            Confirmed: ["Shipped", "Cancelled"],
            Shipped: ["Delivered"],
            Delivered: [],
            Cancelled: []
        };

        const validStatuses = [
            "Pending",
            "Confirmed",
            "Shipped",
            "Delivered",
            "Cancelled"
        ];

        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const currentStatus = order.orderStatus;

        // Prevent invalid status transitions
        if (!validTransitions[currentStatus].includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot change order status from ${currentStatus} to ${orderStatus}`
            });
        }

        // Restore stock when cancelling
        if (orderStatus === "Cancelled") {
            for (const item of order.orderItems) {
                const product = await Product.findById(item.product);

                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }

        order.orderStatus = orderStatus;

        // COD order becomes paid when delivered
        if (
            order.paymentMethod === "COD" &&
            orderStatus === "Delivered"
        ) {
            order.isPaid = true;
            order.paidAt = new Date();
        }

        await order.save();

        await order.populate("user", "name email");
        await order.populate("orderItems.product");

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order
        });

    } catch (error) {
        console.error("Update Order Status Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
