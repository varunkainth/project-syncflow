import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class UploadService {
    async uploadImage(file: File): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: "image", folder: "antigravity/avatars" },
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error("Upload failed"));
                    resolve(result.secure_url);
                }
            );

            uploadStream.end(buffer);
        });
    }
}
