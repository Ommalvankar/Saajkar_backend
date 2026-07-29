const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/product");

// @desc Create Order
// @route POST /api/orders

exports.createOrder = async (req, res) => {

    try {

        const {
            shippingAddress,
            paymentMethod
        } = req.body;

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
        // Check stock availability
for (const item of cart.items) {

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
        // Reduce product stock
for (const item of cart.items) {

    item.product.stock -= item.quantity;

    await item.product.save();

}

        // Calculate total amount
        const totalAmount = orderItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        // Create order
        const order = await Order.create({
            user: req.user._id,
            orderItems,
            shippingAddress,
            paymentMethod,
            totalAmount
        });

        // Clear cart after placing order
        cart.items = [];
        await cart.save();

        await order.populate("orderItems.product");

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};
// @desc Get Logged-in User Orders
// @route GET /api/orders/my

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

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
// @desc Get Single Order
// @route GET /api/orders/:id

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

        // Only the owner or an admin can view the order
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

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
// @desc Get All Orders (Admin)
// @route GET /api/orders
// @access Admin

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

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
// @desc Update Order Status
// @route PUT /api/orders/:id/status
// @access Admin

exports.updateOrderStatus = async (req, res) => {
    try {

        const { orderStatus } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        order.orderStatus = orderStatus;

        // If delivered, mark payment as completed (for COD)
        // Restore stock if order is cancelled
if (orderStatus === "Cancelled" && order.orderStatus !== "Cancelled") {

    for (const item of order.orderItems) {

        const product = await Product.findById(item.product);

        if (product) {

            product.stock += item.quantity;

            await product.save();

        }

    }

}

order.orderStatus = orderStatus;

// Mark COD order as paid when delivered
if (orderStatus === "Delivered") {
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

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
// @desc Update Order Status
// @route PUT /api/orders/:id/status
// @access Admin

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

if (!validTransitions[currentStatus].includes(orderStatus)) {
    return res.status(400).json({
        success: false,
        message: `Cannot change order status from ${currentStatus} to ${orderStatus}`
    });
}

        order.orderStatus = orderStatus;

        // Mark COD order as paid when delivered
        if (orderStatus === "Delivered") {
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

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};