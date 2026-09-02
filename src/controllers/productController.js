const Product = require("../models/product");
const cloudinary = require("../config/cloudinary");
// @desc    Create a new product
// @route   POST /api/products
exports.createProduct = async (req, res) => {

    try {

        const {
            name,
            description,
            category,
            price,
            discountPrice,
            material,
            stock,
            featured,
            status
        } = req.body;


        // Check image
        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Product image is required"
            });

        }


        // Upload image to Cloudinary
        const uploadResult = await new Promise(
            (resolve, reject) => {

                const stream =
                    cloudinary.uploader.upload_stream(
                        {
                            folder: "saajkar-products"
                        },
                        (error, result) => {

                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }

                        }
                    );

                stream.end(req.file.buffer);

            }
        );


        // Create product
        const product = await Product.create({

            name,
            description,
            category,
            price,
            discountPrice,
            material,
            stock,
            featured,
            status,

            images: [
                {
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url
                }
            ],

            createdBy: req.user._id

        });


        res.status(201).json({

            success: true,

            message: "Product created successfully",

            product

        });


    } catch (error) {

        console.error(
            "Create Product Error:",
            error
        );

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// @desc    Get all products with search, filter, sort & pagination
// @route   GET /api/products
exports.getAllProducts = async (req, res) => {
    try {

        const {
            search,
            category,
            minPrice,
            maxPrice,
            featured,
            sort,
            page = 1,
            limit = 10
        } = req.query;

        let query = {};

        // Search by product name
        if (search) {
            query.name = {
                $regex: search,
                $options: "i"
            };
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Price filter
        if (minPrice || maxPrice) {
            query.price = {};

            if (minPrice)
                query.price.$gte = Number(minPrice);

            if (maxPrice)
                query.price.$lte = Number(maxPrice);
        }

        // Featured filter
        if (featured !== undefined) {
            query.featured = featured === "true";
        }

        let productQuery = Product.find(query).populate("category");

        // Sorting
        if (sort) {
            productQuery = productQuery.sort(sort);
        } else {
            productQuery = productQuery.sort("-createdAt");
        }

        // Pagination
        const skip = (page - 1) * limit;

        productQuery = productQuery
            .skip(skip)
            .limit(Number(limit));

        const products = await productQuery;

        const totalProducts = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            totalProducts,
            currentPage: Number(page),
            totalPages: Math.ceil(totalProducts / limit),
            products
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};exports.getSingleProduct = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id).populate("category");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

// @desc    Update Product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
    try {

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
// @desc    Delete Product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
exports.deleteAllProducts = async (req, res) => {
    try {
        const result = await Product.deleteMany({});

        res.status(200).json({
            success: true,
            message: "All products deleted successfully",
            deletedCount: result.deletedCount
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
