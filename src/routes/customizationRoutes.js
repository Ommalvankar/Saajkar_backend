const express = require("express");

const {
    createCustomizationRequest,
    getAllCustomizationRequests,
    updateCustomizationStatus
} = require("../controllers/customizationController");

const {
    protect,
    admin
} = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");

const router = express.Router();


// Customer submits customization request
router.post(
    "/",
    upload.array("referenceImages", 5),
    createCustomizationRequest
);


// Admin gets all customization requests
router.get(
    "/",
    protect,
    admin,
    getAllCustomizationRequests
);


// Admin updates request status
router.put(
    "/:id/status",
    protect,
    admin,
    updateCustomizationStatus
);


module.exports = router;
