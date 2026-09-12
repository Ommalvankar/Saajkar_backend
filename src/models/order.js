const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        orderItems: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },

                price: {
                    type: Number,
                    required: true
                }
            }
        ],

        shippingAddress: {
            fullName: {
                type: String,
                required: true
            },

            phone: {
                type: String,
                required: true
            },

            address: {
                type: String,
                required: true
            },

            city: {
                type: String,
                required: true
            },

            state: {
                type: String,
                required: true
            },

            pincode: {
                type: String,
                required: true
            }
        },

        paymentMethod: {
            type: String,
            enum: ["COD", "Razorpay"],
            default: "COD"
        },

        totalAmount: {
            type: Number,
            required: true
        },

        deliveryCharges: {
            type: Number,
            default: 0,
            min: 0
        },

        orderStatus: {
            type: String,
            enum: [
                "Pending",
                "Confirmed",
                "Shipped",
                "Delivered",
                "Cancelled"
            ],
            default: "Pending"
        },

        isPaid: {
            type: Boolean,
            default: false
        },

        paidAt: {
            type: Date
        },

        // Razorpay payment details
        razorpayOrderId: {
            type: String
        },

        razorpayPaymentId: {
            type: String
        },

        razorpaySignature: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);
