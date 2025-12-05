import { describe, expect, it, beforeAll } from "bun:test";
import app from "../src/index";
import { encrypt, decrypt } from "./utils";

const BASE_URL = "http://localhost:3000";

describe("Project & Task Module", () => {
    const email = `test-proj-${Date.now()}@example.com`;
    const password = "password123";
    let token = "";
    let userId = "";
    let projectId = "";
    let taskId = "";

    beforeAll(async () => {
        // Signup
        const signupPayload = { email, password, name: "Project Tester" };
        await app.fetch(new Request(`${BASE_URL}/auth/signup`, {
            method: "POST",
            body: JSON.stringify({ data: encrypt(signupPayload) }),
            headers: { "Content-Type": "application/json" },
        }));

        // Login
        const loginPayload = { email, password };
        const res = await app.fetch(new Request(`${BASE_URL}/auth/login`, {
            method: "POST",
            body: JSON.stringify({ data: encrypt(loginPayload) }),
            headers: { "Content-Type": "application/json" },
        }));
        const body = await res.json() as any;
        const decrypted = decrypt(body.data);
        token = decrypted.token;
        userId = decrypted.user.id;
    });

    it("should create a project", async () => {
        const payload = { name: "Test Project", description: "A test project" };
        const req = new Request(`${BASE_URL}/projects`, {
            method: "POST",
            body: JSON.stringify({ data: encrypt(payload) }),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        const res = await app.fetch(req);
        expect(res.status).toBe(201);

        const body = await res.json() as any;
        const decrypted = decrypt(body.data);
        expect(decrypted.project).toBeDefined();
        expect(decrypted.project.name).toBe(payload.name);
        projectId = decrypted.project.id;
    });

    it("should create a task in the project", async () => {
        const payload = {
            title: "Test Task",
            description: "Task description",
            projectId: projectId
        };
        const req = new Request(`${BASE_URL}/tasks`, {
            method: "POST",
            body: JSON.stringify({ data: encrypt(payload) }),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        const res = await app.fetch(req);
        if (res.status !== 201) {
            const errorBody = await res.json();
            console.log("Task creation failed:", JSON.stringify(errorBody, null, 2));
        }
        expect(res.status).toBe(201);

        const body = await res.json() as any;
        const decrypted = decrypt(body.data);
        expect(decrypted.task).toBeDefined();
        expect(decrypted.task.title).toBe(payload.title);
        taskId = decrypted.task.id;
    });
});
