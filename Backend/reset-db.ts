import { db } from "./src/db/index";
import { sql } from "drizzle-orm";

async function resetDatabase() {
    console.log("⚠️  Resetting database - dropping all tables...");

    // Drop all tables in the correct order (respecting foreign keys)
    const tables = [
        "time_entries",
        "task_labels",
        "labels",
        "task_dependencies",
        "sub_tasks",
        "attachments",
        "comments",
        "activity_logs",
        "notifications",
        "messages",
        "chat_channels",
        "tasks",
        "project_members",
        "projects",
        "sessions",
        "users"
    ];

    for (const table of tables) {
        try {
            await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE`));
            console.log(`✅ Dropped table: ${table}`);
        } catch (error: any) {
            console.log(`⚠️  Could not drop ${table}: ${error.message}`);
        }
    }

    console.log("\n🎉 Database reset complete! Run 'bun run db:push' to recreate tables.");
    process.exit(0);
}

resetDatabase();
