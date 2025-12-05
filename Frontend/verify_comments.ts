
import axios from "axios";
import CryptoJS from "crypto-js";

const API_URL = "http://localhost:3000";
const EMAIL = "test@example.com";
const PASSWORD = "password123";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "supersecretkeythatis32byteslong123";

// Encryption Utils
function encryptPayload(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
}

function decryptPayload(encryptedData: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
}

const client = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    validateStatus: () => true,
});

async function main() {
    console.log("Signing up...");
    try {
        await client.post("/auth/signup", {
            data: encryptPayload({ email: EMAIL, password: PASSWORD, name: "Test User" })
        });
        console.log("Signup successful (or already exists)");
    } catch (e) {
        console.log("Signup failed (likely already exists), proceeding to login");
    }

    console.log("Logging in...");
    const loginRes = await client.post("/auth/login", {
        data: encryptPayload({ email: EMAIL, password: PASSWORD })
    });

    if (loginRes.status !== 200) {
        console.error("Login failed:", loginRes.data);
        return;
    }
    console.log("Login successful");

    // Extract cookies
    const cookies = loginRes.headers['set-cookie'];
    if (cookies) {
        client.defaults.headers.common['Cookie'] = cookies.join('; ');
        console.log("Cookies set:", cookies);
    } else {
        console.warn("No cookies received from login!");
    }

    // Create Project
    console.log("Creating project...");
    const projectRes = await client.post("/projects", {
        data: encryptPayload({ name: "Comment Test Project", description: "Testing comments" })
    });
    const project = decryptPayload(projectRes.data.data).project;
    console.log("Project created:", project.id);

    // Create Task
    console.log("Creating task...");
    const taskRes = await client.post("/tasks", {
        data: encryptPayload({ projectId: project.id, title: "Comment Task" })
    });
    const task = decryptPayload(taskRes.data.data).task;
    console.log("Task created:", task.id);

    // 1. Add Comment
    console.log("1. Adding comment...");
    const commentRes = await client.post(`/tasks/${task.id}/comments`, {
        data: encryptPayload({ content: "Root comment" })
    });
    if (commentRes.status !== 201) {
        console.error("Failed to add comment:", commentRes.data);
        return;
    }
    const comment = decryptPayload(commentRes.data.data).comment;
    console.log("Comment added:", comment.id);

    // 2. Add Reply
    console.log("2. Adding reply...");
    const replyRes = await client.post(`/tasks/${task.id}/comments`, {
        data: encryptPayload({ content: "Reply comment", parentId: comment.id })
    });
    if (replyRes.status !== 201) {
        console.error("Failed to add reply:", replyRes.data);
        return;
    }
    const reply = decryptPayload(replyRes.data.data).comment;
    console.log("Reply added:", reply.id);

    // 3. Update Comment
    console.log("3. Updating comment...");
    const updateRes = await client.patch(`/tasks/comments/${comment.id}`, {
        data: encryptPayload({ content: "Updated Root comment" })
    });
    if (updateRes.status !== 200) {
        console.error("Failed to update comment:", updateRes.data);
        return;
    }
    const updatedComment = decryptPayload(updateRes.data.data).comment;
    console.log("Comment updated:", updatedComment.content);

    // 4. Delete Reply
    console.log("4. Deleting reply...");
    const deleteReplyRes = await client.delete(`/tasks/comments/${reply.id}`);
    if (deleteReplyRes.status !== 200) {
        console.error("Failed to delete reply:", deleteReplyRes.data);
        return;
    }
    console.log("Reply deleted");

    // 5. Add another reply for cascade test
    console.log("5. Adding another reply to test cascade...");
    const reply2Res = await client.post(`/tasks/${task.id}/comments`, {
        data: encryptPayload({ content: "Reply 2", parentId: comment.id })
    });
    const reply2 = decryptPayload(reply2Res.data.data).comment;
    console.log("Reply 2 added:", reply2.id);

    // 6. Delete Parent Comment
    console.log("6. Deleting parent comment...");
    const deleteParentRes = await client.delete(`/tasks/comments/${comment.id}`);
    if (deleteParentRes.status !== 200) {
        console.error("Failed to delete parent:", deleteParentRes.data);
        return;
    }
    console.log("Parent deleted");

    // 7. Verify Cascade
    console.log("7. Verifying cascade delete...");
    const getTaskRes = await client.get(`/tasks/${task.id}`);
    const fetchedTask = decryptPayload(getTaskRes.data.data).task;

    // Should have 0 comments because we deleted the only root comment which had one reply
    if (fetchedTask.comments.length === 0) {
        console.log("Cascade delete successful (no comments left)");
    } else {
        console.error("Cascade delete failed, comments remain:", fetchedTask.comments);
    }
}

main();
