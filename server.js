require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();   // <-- Move this here

const cartRoutes = require("./src/routes/cartRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const wishlistRoutes = require("./src/routes/wishlistRoutes");
const orderRoutes = require("./src/routes/orderRoutes");

const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Temporary test route
app.get("/", (req, res) => {
    res.send("Saajkar Backend Running");
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);   // ✅ Add this line
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);

app.get('/api', (req, res) => {
    res.json({ message: "🚀 Saajkar API Engine is live!" });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Cloud Cluster successfully connected!'))
    .catch(err => console.error('❌ Database Handshake Failed:', err.message));

app.listen(PORT, () => {
    console.log(`🚀 Server safely executing on port ${PORT}`);
});