const CustomizationRequest = require("../models/customizationRequest");
const cloudinary = require("../config/cloudinary");

// CREATE CUSTOMIZATION REQUEST
exports.createCustomizationRequest = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            jewelleryType,
            material,
            budget,
            description
        } = req.body;

        // Validate required fields
        if (
            !name ||
            !email ||
            !phone ||
            !jewelleryType ||
            !material ||
            !budget ||
            !description
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields"
            });
        }

        const referenceImages = [];

        // Upload reference images to Cloudinary
        if (req.files && req.files.length > 0) {

            for (const file of req.files) {

                const uploadResult = await new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream(
                                {
                                    folder: "saajkar-customizations"
                                },
                                (error, result) => {

                                    if (error) {
                                        reject(error);
                                    } else {
                                        resolve(result);
                                    }
                                }
                            );

                        stream.end(file.buffer);
                    }
                );

                referenceImages.push({
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url
                });
            }
        }

        // Save customization request
        const customizationRequest =
            await CustomizationRequest.create({
                name,
                email,
                phone,
                jewelleryType,
                material,
                budget,
                description,
                referenceImages
            });

        res.status(201).json({
            success: true,
            message:
                "Customization request submitted successfully",
            customizationRequest
        });

    } catch (error) {

        console.error(
            "Customization request error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// GET ALL CUSTOMIZATION REQUESTS
exports.getAllCustomizationRequests =
    async (req, res) => {

        try {

            const requests =
                await CustomizationRequest.find()
                    .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: requests.length,
                requests
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


// UPDATE CUSTOMIZATION REQUEST STATUS
exports.updateCustomizationStatus =
    async (req, res) => {

        try {

            const { status } = req.body;

            const allowedStatuses = [
                "Pending",
                "Contacted",
                "In Progress",
                "Completed"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status"
                });
            }

            const request =
                await CustomizationRequest.findByIdAndUpdate(
                    req.params.id,
                    { status },
                    {
                        new: true,
                        runValidators: true
                    }
                );

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Customization request not found"
                });
            }

            res.status(200).json({
                success: true,
                message:
                    "Customization status updated successfully",
                request
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };
