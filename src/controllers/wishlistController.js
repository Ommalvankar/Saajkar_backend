const Wishlist = require("../models/wishlist");
const Product = require("../models/product");

// @desc Add product to wishlist
// @route POST /api/wishlist

exports.addToWishlist = async (req, res) => {
    try {

        const { productId } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Find user's wishlist
        let wishlist = await Wishlist.findOne({
            user: req.user._id
        });

        // Create wishlist if it doesn't exist
        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: req.user._id,
                products: [productId]
            });

            await wishlist.populate("products");

            return res.status(201).json({
                success: true,
                message: "Product added to wishlist",
                wishlist
            });
        }

        // Prevent duplicate products
        const alreadyExists = wishlist.products.some(
            product => product.toString() === productId
        );

        if (alreadyExists) {
            return res.status(400).json({
                success: false,
                message: "Product already exists in wishlist"
            });
        }

        // Add product
        wishlist.products.push(productId);

        await wishlist.save();

        await wishlist.populate("products");

        res.status(200).json({
            success: true,
            message: "Product added to wishlist",
            wishlist
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
// @desc Get wishlist
// @route GET /api/wishlist

exports.getWishlist = async (req, res) => {
    try {

        const wishlist = await Wishlist.findOne({
            user: req.user._id
        }).populate("products");

        if (!wishlist) {
            return res.status(200).json({
                success: true,
                wishlist: {
                    products: []
                }
            });
        }

        res.status(200).json({
            success: true,
            wishlist
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
// @desc Remove product from wishlist
// @route DELETE /api/wishlist/:productId

exports.removeFromWishlist = async (req, res) => {
    try {

        const wishlist = await Wishlist.findOne({
            user: req.user._id
        });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: "Wishlist not found"
            });
        }

        const productExists = wishlist.products.some(
            product => product.toString() === req.params.productId
        );

        if (!productExists) {
            return res.status(404).json({
                success: false,
                message: "Product not found in wishlist"
            });
        }

        wishlist.products = wishlist.products.filter(
            product => product.toString() !== req.params.productId
        );

        await wishlist.save();

        await wishlist.populate("products");

        res.status(200).json({
            success: true,
            message: "Product removed from wishlist",
            wishlist
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};