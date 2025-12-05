import axios from "axios";
import CryptoJS from "crypto-js";

const BASE_URL = "http://localhost:3000";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "supersecretkeythatis32byteslong123";

const encryptPayload = (data: any) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

const decryptPayload = (ciphertext: string) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

let cookieJar: string[] = [];

const updateCookies = (headers: any) => {
    const setCookie = headers["set-cookie"];
    if (setCookie) {
        if (Array.isArray(setCookie)) {
            setCookie.forEach(c => {
                const name = c.split("=")[0];
                cookieJar = cookieJar.filter(existing => !existing.startsWith(name + "="));
                if (!c.includes("Max-Age=0") && !c.includes("Expires=Thu, 01 Jan 1970")) {
                    cookieJar.push(c.split(";")[0]);
                }
            });
        } else {
            const name = setCookie.split("=")[0];
            cookieJar = cookieJar.filter(existing => !existing.startsWith(name + "="));
            if (!setCookie.includes("Max-Age=0") && !setCookie.includes("Expires=Thu, 01 Jan 1970")) {
                cookieJar.push(setCookie.split(";")[0]);
            }
        }
    }
};

const getCookieHeader = () => {
    return cookieJar.join("; ");
};

async function request(path: string, method: string, body?: any) {
    const headers: any = {
        "Content-Type": "application/json",
        "Cookie": getCookieHeader()
    };

    const options: any = {
        method,
        url: `${BASE_URL}${path}`,
        headers,
        validateStatus: () => true
    };

    if (body) {
        options.data = { data: encryptPayload(body) };
    }

    const res = await axios(options);
    updateCookies(res.headers);

    let data = res.data;
    if (data && data.data) {
        data = decryptPayload(data.data);
    }

    return { status: res.status, data, headers: res.headers };
}

async function main() {
    const email = `test_settings_${Date.now()}@example.com`;
    const password = "password123";

    console.log(`1. Signing up user: ${email}`);
    const signupRes = await request("/auth/signup", "POST", {
        email,
        password,
        name: "Settings User"
    });

    if (signupRes.status !== 201) {
        console.error("Signup failed:", signupRes.data);
        process.exit(1);
    }

    console.log("\n2. Creating a Project");
    const createRes = await request("/projects", "POST", {
        name: "To Be Deleted",
        description: "This project will be deleted"
    });

    if (createRes.status !== 201) {
        console.error("Create Project failed:", createRes.data);
        process.exit(1);
    }
    const projectId = createRes.data.project.id;
    console.log("Project Created:", projectId);

    console.log("\n3. Updating Project");
    const updateRes = await request(`/projects/${projectId}`, "PATCH", {
        name: "Updated Name",
        description: "Updated Description",
        status: "on_hold"
    });

    if (updateRes.status !== 200) {
        console.error("Update Project failed:", updateRes.data);
        process.exit(1);
    }
    console.log("Project Updated:", updateRes.data.project.name, updateRes.data.project.status);

    if (updateRes.data.project.name !== "Updated Name" || updateRes.data.project.status !== "on_hold") {
        console.error("FAILED: Project details not updated");
        process.exit(1);
    }

    console.log("\n4. Deleting Project");
    const deleteRes = await request(`/projects/${projectId}`, "DELETE");
    if (deleteRes.status !== 200) {
        console.error("Delete Project failed:", deleteRes.data);
        process.exit(1);
    }
    console.log("Project Deleted");

    console.log("\n5. Verifying Deletion");
    const getRes = await request(`/projects/${projectId}`, "GET");
    if (getRes.status !== 404) {
        console.error("FAILED: Project still exists after deletion", getRes.status);
        process.exit(1);
    }
    console.log("Project not found (as expected)");

    console.log("\nSUCCESS: Project Settings API Verified!");
}

main().catch(console.error);
