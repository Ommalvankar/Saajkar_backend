require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Routes
const cartRoutes = require("./src/routes/cartRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const wishlistRoutes = require("./src/routes/wishlistRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const customizationRoutes = require("./src/routes/customizationRoutes");

const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {
    res.send("Saajkar Backend Running");
});

// ===============================
// API ROUTES
// ===============================

app.use(
    "/api/auth",
    require("./src/routes/authRoutes")
);

app.use(
    "/api/products",
    require("./src/routes/productRoutes")
);

app.use(
    "/api/upload",
    uploadRoutes
);

app.use(
    "/api/categories",
    categoryRoutes
);

app.use(
    "/api/cart",
    cartRoutes
);

app.use(
    "/api/wishlist",
    wishlistRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);

// Customization Requests
app.use(
    "/api/customizations",
    customizationRoutes
);

// ===============================
// API STATUS
// ===============================

app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "🚀 Saajkar API Engine is live!"
    });
});

// ===============================
// MONGODB CONNECTION
// ===============================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log(
            "✅ MongoDB Cloud Cluster successfully connected!"
        );
    })
    .catch((error) => {
        console.error(
            "❌ Database Handshake Failed:",
            error.message
        );
    });

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
    console.log(
        `🚀 Server safely executing on port ${PORT}`
    );
});s
