
import { db } from "../src/db";
import { users, projects, projectMembers, tasks, attachments, roles } from "../src/db/schema";
import { ProjectService } from "../src/modules/projects/service";
import { TaskService } from "../src/modules/tasks/service";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const projectService = new ProjectService();
const taskService = new TaskService();

async function main() {
    console.log("🚀 Starting Attachment Verification...");

    // 1. Setup Data
    console.log("Creating test users and project...");
    // Create users manually to avoid auth flow complexity
    const [owner] = await db.insert(users).values({ email: `owner-${uuidv4()}@test.com`, name: "Owner" }).returning();
    const [member] = await db.insert(users).values({ email: `member-${uuidv4()}@test.com`, name: "Member" }).returning();

    // Create Project
    const project = await projectService.createProject(owner.id, "Attachment Test Project");
    console.log(`Created Project: ${project.id}`);

    // Add member
    // Ensure member role exists
    let memberRole = await db.query.roles.findFirst({ where: eq(roles.name, "member") });
    if (!memberRole) {
        console.log("Seeding member role...");
        [memberRole] = await db.insert(roles).values({
            name: "member",
            description: "Regular member",
            isSystem: true // Assuming this field exists, check schema later if fails
        } as any).returning();
    }

    // Check if permissions need to be seeded? Assuming basic roles are enough for simple RBAC check which just checks role name


    // Actually projectService.inviteMember handles this logic better but let's assume we can add them directly for speed if needed, 
    // but easier to just use service if possible. 
    // Let's manually insert the member for speed as 'member'
    await db.insert(projectMembers).values({
        projectId: project.id,
        userId: member.id,
        roleId: 2, // Hardcoded standard member ID usually, but better to query.
        status: 'active'
    });
    // Re-fetch role id properly
    const memberRoleId = (await db.query.roles.findFirst({ where: (roles, { eq }) => eq(roles.name, "member") }))?.id;
    if (memberRoleId) {
        await db.update(projectMembers).set({ roleId: memberRoleId }).where(eq(projectMembers.userId, member.id));
    }


    // 2. Test Project Attachments
    console.log("\n🧪 Testing Project Attachments...");

    // Owner Upload -> Should Success
    try {
        const att = await projectService.addAttachment(project.id, owner.id, "http://fake.url/file.pdf", "specs.pdf");
        console.log("✅ Owner upload success:", att.id);

        // Member Upload -> Should Fail
        try {
            await projectService.addAttachment(project.id, member.id, "http://fake.url/evil.exe", "virus.exe");
            console.error("❌ Member upload should have failed!");
        } catch (e: any) {
            console.log("✅ Member upload failed as expected:", e.message);
        }

        // Owner Delete -> Should Success
        await projectService.removeAttachment(project.id, owner.id, att.id);
        console.log("✅ Owner delete success");

    } catch (e) {
        console.error("❌ Project Attachment Test Failed:", e);
    }

    // 3. Test Task Attachments
    console.log("\n🧪 Testing Task Attachments...");
    const task = await taskService.createTask(owner.id, { projectId: project.id, title: "Test Task" });

    // Member Upload to Task -> Should Success (Tasks are collaborative)
    try {
        const att = await taskService.addAttachment(member.id, task.id, "http://fake.url/design.png", "design.png");
        console.log("✅ Member task upload success:", att.id);

        // Verify it shows up in getTaskById
        const taskWithAtt = await taskService.getTaskById(task.id, member.id);
        if (taskWithAtt?.attachments.length === 1) {
            console.log("✅ Attachment present in task query");
        } else {
            console.error("❌ Attachment missing from task query");
        }

    } catch (e) {
        console.error("❌ Task Attachment Test Failed:", e);
    }

    console.log("\n✨ Verification Complete!");
    process.exit(0);
}

main();
