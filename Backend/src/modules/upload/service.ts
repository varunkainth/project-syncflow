import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class UploadService {
    async uploadFile(file: File, folder: string = "syncflow/uploads"): Promise<{ url: string; filename: string }> {
        return new Promise(async (resolve, reject) => {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const filename = file.name;

            // Determine resource type based on file (auto lets Cloudinary decide)
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    folder: folder,
                    use_filename: true,
                    unique_filename: true
                },
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error("Upload failed"));
                    resolve({ url: result.secure_url, filename });
                }
            );

            uploadStream.end(buffer);
        });
    }

    async uploadImage(file: File): Promise<string> {
        const result = await this.uploadFile(file, "syncflow/avatars");
        return result.url;
    }
}

