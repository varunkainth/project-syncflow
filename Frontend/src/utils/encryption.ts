import CryptoJS from "crypto-js";

// Fix: Add VITE_ prefix
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;


const encryptPayload = (data: any) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

const decryptPayload = (ciphertext: string) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

        // Add check for empty string
        if (!decryptedData) {
            console.error("Decryption produced empty result");
            return null;
        }

        return JSON.parse(decryptedData);
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
};

export { encryptPayload, decryptPayload };