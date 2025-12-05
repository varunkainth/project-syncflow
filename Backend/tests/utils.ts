import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "supersecretkeythatis32byteslong123";

export const encrypt = (data: any) => {
    console.log("Encrypting payload:", JSON.stringify(data));
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

export const decrypt = (ciphertext: string) => {
    if (!ciphertext) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (e) {
        return null;
    }
};

export const headers = {
    "Content-Type": "application/json",
};
