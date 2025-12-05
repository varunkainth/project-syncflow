import { db } from "./index";
import { projects, projectMembers, roles } from "./schema";
import { eq, and } from "drizzle-orm";

async function migrateExistingProjects() {
    console.log("🔄 Migrating existing projects...");

    try {
        // Get owner role ID
        const ownerRole = await db.query.roles.findFirst({
            where: eq(roles.name, "owner"),
        });

        if (!ownerRole) {
            console.error("❌ Owner role not found. Please run seedRoles.ts first");
            return;
        }

        console.log(`✓ Owner role found (ID: ${ownerRole.id})`);

        // Get all projects
        const allProjects = await db.query.projects.findMany();

        console.log(`Found ${allProjects.length} projects to migrate`);

        for (const project of allProjects) {
            console.log(`\nMigrating project: ${project.name} (${project.id})`);

            // Find the project owner in projectMembers
            const ownerMember = await db.query.projectMembers.findFirst({
                where: and(
                    eq(projectMembers.projectId, project.id),
                    eq(projectMembers.userId, project.ownerId)
                ),
            });

            if (ownerMember) {
                // Update to owner role with active status
                await db.update(projectMembers)
                    .set({
                        roleId: ownerRole.id,
                        status: 'active',
                    })
                    .where(
                        and(
                            eq(projectMembers.projectId, project.id),
                            eq(projectMembers.userId, project.ownerId)
                        )
                    );

                console.log(`  ✓ Updated owner ${project.ownerId} to owner role with active status`);
            } else {
                console.log(`  ⚠️  Owner not found in projectMembers, skipping`);
            }
        }

        console.log("\n✅ Migration complete!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        throw error;
    }
}

// Run migration
if (import.meta.main) {
    migrateExistingProjects()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
