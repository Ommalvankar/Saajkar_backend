console.log("📦 productRoutes loaded");
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const upload = require("../middleware/upload");
const {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    deleteAllProducts
} = require("../controllers/productController");

router.delete(
    "/delete-all",
    protect,
    admin,
    deleteAllProducts
);

router.delete(
    "/:id",
    protect,
    admin,
    deleteProduct
);
// Create Product
router.post("/", protect, admin, upload.single("image"),createProduct);

// Get All Products
router.get("/", getAllProducts);

// Get Single Product
router.get("/:id", getSingleProduct);

// Update Product
router.put("/:id", protect, admin, updateProduct);

module.exports = router;
