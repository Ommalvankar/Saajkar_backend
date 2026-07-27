const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

exports.uploadImage = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image uploaded"
            });
        }

        const streamUpload = () => {
            return new Promise((resolve, reject) => {

                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "saajkar-products"
                    },
                    (error, result) => {

                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }

                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);

            });
        };

        const result = await streamUpload();

        res.status(200).json({
            success: true,
            image: {
                public_id: result.public_id,
                url: result.secure_url
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Image upload failed"
        });

    }
};