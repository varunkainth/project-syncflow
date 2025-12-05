import { describe, expect, it, beforeAll } from "bun:test";
import app from "../src/index";
import { encrypt, decrypt } from "./utils";

const BASE_URL = "http://localhost:3000";

describe("Auth Module", () => {
    const email = `test-${Date.now()}@example.com`;
    const password = "password123";
    let token = "";

    it("should signup a new user", async () => {
        const payload = { email, password, name: "Test User" };
        const encryptedBody = { data: encrypt(payload) };

        const req = new Request(`${BASE_URL}/auth/signup`, {
            method: "POST",
            body: JSON.stringify(encryptedBody),
            headers: { "Content-Type": "application/json" },
        });

        const res = await app.fetch(req);
        expect(res.status).toBe(201);

        const body = await res.json() as any;
        const decrypted = decrypt(body.data);
        expect(decrypted.user).toBeDefined();
        expect(decrypted.user.email).toBe(email);
    }, 30000);

    it("should login the user", async () => {
        const payload = { email, password };
        const encryptedBody = { data: encrypt(payload) };

        const req = new Request(`${BASE_URL}/auth/login`, {
            method: "POST",
            body: JSON.stringify(encryptedBody),
            headers: { "Content-Type": "application/json" },
        });

        const res = await app.fetch(req);
        expect(res.status).toBe(200);

        const body = await res.json() as any;
        const decrypted = decrypt(body.data);
        expect(decrypted.token).toBeDefined();
        token = decrypted.token;
    }, 30000);
});
