const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { protect } = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const { uploadImage } = require("../controllers/uploadController");

// POST /api/upload
router.post(
    "/",
    protect,
    admin,
    upload.single("image"),
    uploadImage
);

module.exports = router;