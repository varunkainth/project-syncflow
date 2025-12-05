import type { ServerWebSocket } from "bun";
import { ChatService } from "./service";
import CryptoJS from "crypto-js";

const chatService = new ChatService();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "supersecretkeythatis32byteslong123";

// Helper to decrypt/encrypt
const decrypt = (ciphertext: string) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) { return null; }
};

const encrypt = (text: string) => {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

export const websocketHandler = {
    open(ws: ServerWebSocket<any>) {
        console.log("WS Connected");
    },
    async message(ws: ServerWebSocket<any>, message: string | Buffer | Blob | ArrayBuffer | SharedArrayBuffer) {
        if (typeof message !== "string") return;

        const decryptedStr = decrypt(message);
        if (!decryptedStr) {
            ws.send(encrypt(JSON.stringify({ error: "Invalid encryption" })));
            return;
        }

        let payload;
        try {
            payload = JSON.parse(decryptedStr);
        } catch (e) { return; }

        if (payload.type === "chat") {
            const { channelId, senderId, content } = payload;
            const savedMsg = await chatService.saveMessage(channelId, senderId, content);

            ws.subscribe(channelId);
            ws.publish(channelId, encrypt(JSON.stringify({ type: "new_message", message: savedMsg })));
        } else if (payload.type === "join") {
            ws.subscribe(payload.channelId);
        }
    },
    close(ws: ServerWebSocket<any>) {
        console.log("WS Closed");
    },
};
