const Cart = require("../models/cart");
const Product = require("../models/product");

// @desc Add product to cart
// @route POST /api/cart
exports.addToCart = async (req, res) => {
    try {

        const { productId, quantity } = req.body;
        if (!quantity || quantity < 1) {
    return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1"
    });
}

        // Check if product exists
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Find user's cart
        let cart = await Cart.findOne({
            user: req.user._id
        });

        // If no cart exists, create one
        if (!cart) {

            cart = await Cart.create({
                user: req.user._id,
                items: [
                    {
                        product: productId,
                        quantity
                    }
                ]
            });

        } else {

            // Check if product already exists in cart
            const itemIndex = cart.items.findIndex(
                item => item.product.toString() === productId
            );

            if (itemIndex > -1) {

                cart.items[itemIndex].quantity += quantity;

            } else {

                cart.items.push({
                    product: productId,
                    quantity
                });

            }

            await cart.save();
        }

        res.status(200).json({
            success: true,
            message: "Product added to cart",
            cart
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

// @desc Get logged-in user's cart
// @route GET /api/cart

exports.getCart = async (req, res) => {
    try {

        const cart = await Cart.findOne({
            user: req.user._id
        }).populate("items.product");

        if (!cart) {
            return res.status(200).json({
                success: true,
                cart: {
                    items: []
                }
            });
        }

        res.status(200).json({
            success: true,
            cart
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
// @desc Update cart item quantity
// @route PUT /api/cart

exports.updateCart = async (req, res) => {
    try {

        const { productId, quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1"
            });
        }

        const cart = await Cart.findOne({
            user: req.user._id
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const item = cart.items.find(
            item => item.product.toString() === productId
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        item.quantity = quantity;

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            cart
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
// @desc Remove product from cart
// @route DELETE /api/cart/:productId

exports.removeFromCart = async (req, res) => {
    try {

        const cart = await Cart.findOne({
            user: req.user._id
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // Check if product exists in cart
        const itemExists = cart.items.some(
            item => item.product.toString() === req.params.productId
        );

        if (!itemExists) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        // Remove product
        cart.items = cart.items.filter(
            item => item.product.toString() !== req.params.productId
        );

        await cart.save();

        // Populate product details
        await cart.populate("items.product");

        res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
// @desc Clear cart
// @route DELETE /api/cart

exports.clearCart = async (req, res) => {
    try {

        const cart = await Cart.findOne({
            user: req.user._id
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        cart.items = [];

        await cart.save();

        res.status(200).json({
    success: true,
    message: "Cart cleared successfully",
    cart
});
    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};