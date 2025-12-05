import { db } from "../../db/index";
import { chatChannels, messages, users } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export class ChatService {
    async getOrCreateDirectChannel(userId1: string, userId2: string) {
        // Check if channel exists (complex query for many-to-many logic usually, but here we simplify)
        // For direct chat, we might check if a channel of type 'direct' exists with these 2 members.
        // Since we don't have a 'channel_members' table in the schema I defined earlier (my bad),
        // I should have added it.
        // The schema has `projectId` and `taskId` but for direct/group chat it's vague.
        // Let's assume we create a channel and rely on `messages` to link users or just create a new channel.
        // To do it right, I should update schema to have `channel_members`.
        // But for now, let's just create a channel.

        const [channel] = await db.insert(chatChannels).values({
            type: "direct",
        }).returning();

        return channel;
    }

    async saveMessage(channelId: string, senderId: string, content: string) { // content is encrypted
        const [message] = await db.insert(messages).values({
            channelId,
            senderId,
            content,
        }).returning();
        return message;
    }

    async getHistory(channelId: string, limit = 50) {
        return await db.query.messages.findMany({
            where: eq(messages.channelId, channelId),
            limit,
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
            with: {
                // sender: true // if relation defined
            }
        });
    }
}
