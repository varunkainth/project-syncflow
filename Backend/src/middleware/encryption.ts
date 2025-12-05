import type { Context, Next } from "hono";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "supersecretkeythatis32byteslong123";

// Helper to decrypt payload
const decryptPayload = (ciphertext: string) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedData);
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
};

// Helper to encrypt payload
const encryptPayload = (data: any) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

export const encryptionMiddleware = async (c: Context, next: Next) => {
    console.log(`EncryptionMiddleware called for ${c.req.method} ${c.req.path}`);
    // 1. Decrypt Request Body (if present and encrypted)
    const contentType = c.req.header("Content-Type");
    console.log("Content-Type:", contentType);
    if (c.req.method === "POST" || c.req.method === "PUT" || c.req.method === "PATCH") {
        if (contentType === "application/json") {
            try {
                const body = await c.req.json();
                console.log("Middleware read body keys:", Object.keys(body));

                if (body.data && typeof body.data === "string") {
                    const decrypted = decryptPayload(body.data);
                    if (!decrypted) {
                        return c.json({ error: "Invalid encrypted payload" }, 400);
                    }
                    console.log("Middleware decrypted:", JSON.stringify(decrypted));
                    c.set("decryptedBody", decrypted);
                    c.set("originalBody", body);
                }
            } catch (e) {
                console.error("Middleware JSON parse error:", e);
            }
        }
    } else {
        console.log("Middleware: Not a POST or PUT request");
    }

    await next();
};

// Utility to send encrypted response
export const jsonEncrypted = (c: Context, data: any, status: number = 200) => {
    const encrypted = encryptPayload(data);
    c.status(status as any);
    c.header("Content-Type", "application/json");
    return c.body(JSON.stringify({ data: encrypted }));
};
