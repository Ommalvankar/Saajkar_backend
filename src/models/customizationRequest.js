const mongoose = require("mongoose");

const customizationRequestSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        jewelleryType: {
            type: String,
            required: true,
            trim: true
        },

        material: {
            type: String,
            required: true,
            trim: true
        },

        budget: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        referenceImages: [
            {
                public_id: String,
                url: String
            }
        ],

        status: {
            type: String,
            enum: [
                "Pending",
                "Contacted",
                "In Progress",
                "Completed"
            ],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "CustomizationRequest",
    customizationRequestSchema
);
