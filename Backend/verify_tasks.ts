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
    const email = `test_tasks_${Date.now()}@example.com`;
    const password = "password123";

    console.log(`1. Signing up user: ${email}`);
    const signupRes = await request("/auth/signup", "POST", {
        email,
        password,
        name: "Task User"
    });

    if (signupRes.status !== 201) {
        console.error("Signup failed:", signupRes.data);
        process.exit(1);
    }

    console.log("\n2. Creating a Project");
    const createProjectRes = await request("/projects", "POST", {
        name: "Task Project",
        description: "Project for tasks"
    });

    if (createProjectRes.status !== 201) {
        console.error("Create Project failed:", createProjectRes.data);
        process.exit(1);
    }
    const projectId = createProjectRes.data.project.id;
    console.log("Project Created:", projectId);

    console.log("\n3. Creating a Task");
    const createTaskRes = await request("/tasks", "POST", {
        projectId,
        title: "Test Task",
        description: "This is a test task",
        status: "todo",
        priority: "high"
    });

    if (createTaskRes.status !== 201) {
        console.error("Create Task failed:", createTaskRes.data);
        process.exit(1);
    }
    const taskId = createTaskRes.data.task.id;
    console.log("Task Created:", taskId);

    console.log("\n4. Getting Task Details");
    const getTaskRes = await request(`/tasks/${taskId}`, "GET");
    if (getTaskRes.status !== 200) {
        console.error("Get Task failed:", getTaskRes.data);
        process.exit(1);
    }
    console.log("Task Fetched:", getTaskRes.data.task.title);

    console.log("\n5. Updating Task");
    const updateTaskRes = await request(`/tasks/${taskId}`, "PATCH", {
        status: "in-progress"
    });
    if (updateTaskRes.status !== 200) {
        console.error("Update Task failed:", updateTaskRes.data);
        process.exit(1);
    }
    console.log("Task Updated:", updateTaskRes.data.task.status);

    console.log("\n6. Adding Comment");
    const commentRes = await request(`/tasks/${taskId}/comments`, "POST", {
        content: "This is a comment"
    });
    if (commentRes.status !== 201) {
        console.error("Add Comment failed:", commentRes.data);
        process.exit(1);
    }
    console.log("Comment Added:", commentRes.data.comment.content);

    console.log("\n7. Deleting Task");
    const deleteTaskRes = await request(`/tasks/${taskId}`, "DELETE");
    if (deleteTaskRes.status !== 200) {
        console.error("Delete Task failed:", deleteTaskRes.data);
        process.exit(1);
    }
    console.log("Task Deleted");

    console.log("\n8. Verifying Deletion");
    const verifyRes = await request(`/tasks/${taskId}`, "GET");
    if (verifyRes.status !== 404) {
        console.error("FAILED: Task still exists");
        process.exit(1);
    }
    console.log("Task not found (as expected)");

    console.log("\nSUCCESS: Task Management Verified!");
}

main().catch(console.error);
