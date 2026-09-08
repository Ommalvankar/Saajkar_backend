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

console.log("CART ROUTES CHECK:", {
    protect: typeof protect,
    addToCart: typeof addToCart,
    getCart: typeof getCart,
    updateCart: typeof updateCart,
    removeFromCart: typeof removeFromCart,
    clearCart: typeof clearCart
});

router.post("/", protect, addToCart);
router.get("/", protect, getCart);
router.put("/", protect, updateCart);
router.delete("/:productId", protect, removeFromCart);
router.delete("/", protect, clearCart);

module.exports = router;
