const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    addToCart,
    getCart,
    updateCart,
    removeFromCart,
    clearCart
} = require("../controllers/cartController");

router.post("/", protect, addToCart);
router.get("/", protect, getCart);
router.put("/", protect, updateCart);
router.delete("/:productId", protect, removeFromCart);
router.delete("/", protect, clearCart);

module.exports = router;