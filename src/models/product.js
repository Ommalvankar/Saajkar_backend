const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
},
    price: {
        type: Number,
        required: true
    },

    discountPrice: {
        type: Number,
        default: 0
    },

    images: [
    {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }
],

    material: {
        type: String,
        default: "Handcrafted"
    },

    stock: {
        type: Number,
        default: 0
    },

    featured: {
        type: Boolean,
        default: false
    },

    status: {
        type: String,
        enum: ["Available", "Out of Stock"],
        default: "Available"
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

},
{
    timestamps: true
});

module.exports =
    mongoose.models.Product ||
    mongoose.model("Product", productSchema);