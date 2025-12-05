import type { Context } from "hono";
import { UploadService } from "./service";
import { jsonEncrypted } from "../../middleware/encryption";

const uploadService = new UploadService();

export const uploadImage = async (c: Context) => {
    try {
        const body = await c.req.parseBody();
        const file = body["file"];

        if (!file || !(file instanceof File)) {
            return c.json({ error: "No file provided" }, 400);
        }

        const url = await uploadService.uploadImage(file);

        // Return clear JSON for now as frontend upload handling is tricky with encryption
        // Or we can just return the URL string in a standard JSON wrapper
        return c.json({ url });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};
