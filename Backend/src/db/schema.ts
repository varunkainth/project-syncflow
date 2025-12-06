import { pgTable, serial, text, timestamp, boolean, integer, uuid, primaryKey, foreignKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").unique().notNull(),
    password: text("password"), // Nullable for OAuth users
    name: text("name"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    phoneNumber: text("phone_number"),
    lastActiveAt: timestamp("last_active_at"),
    isTwoFactorEnabled: boolean("is_two_factor_enabled").default(false),
    twoFactorSecret: text("two_factor_secret"),
    resetToken: text("reset_token"),
    resetTokenExpiresAt: timestamp("reset_token_expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions
export const sessions = pgTable("sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    token: text("token").unique().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// Refresh Tokens
export const refreshTokens = pgTable("refresh_tokens", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    token: text("token").unique().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    revoked: boolean("revoked").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

// RBAC: Roles & Permissions
export const roles = pgTable("roles", {
    id: serial("id").primaryKey(),
    name: text("name").unique().notNull(), // e.g., 'admin', 'member', 'viewer'
    description: text("description"),
});

export const permissions = pgTable("permissions", {
    id: serial("id").primaryKey(),
    name: text("name").unique().notNull(), // e.g., 'project:create', 'task:delete'
    description: text("description"),
});

export const rolePermissions = pgTable("role_permissions", {
    roleId: integer("role_id").references(() => roles.id).notNull(),
    permissionId: integer("permission_id").references(() => permissions.id).notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
}));

// Projects
export const projects = pgTable("projects", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").default("active"), // active, archived, completed, on_hold
    ownerId: uuid("owner_id").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectMembers = pgTable("project_members", {
    projectId: uuid("project_id").references(() => projects.id).notNull(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    roleId: integer("role_id").references(() => roles.id).notNull(),
    status: text("status").default("pending").notNull(), // 'pending', 'active', 'declined'
    joinedAt: timestamp("joined_at").defaultNow(),
}, (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.userId] }),
}));

// Project Invite Links
export const projectInviteLinks = pgTable("project_invite_links", {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    createdBy: uuid("created_by").references(() => users.id).notNull(),
    token: text("token").unique().notNull(), // Unique invite token
    roleId: integer("role_id").references(() => roles.id).notNull(),
    maxUses: integer("max_uses"), // null = unlimited
    usesCount: integer("uses_count").default(0),
    expiresAt: timestamp("expires_at"), // null = never expires
    createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    type: text("type").notNull(), // 'invite', 'task_assigned', 'task_updated', 'comment', 'project_update'
    title: text("title").notNull(),
    message: text("message").notNull(),
    actionUrl: text("action_url"), // Where to navigate when clicked
    entityType: text("entity_type"), // 'project', 'task', 'comment'
    entityId: uuid("entity_id"),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// Tasks
export const tasks = pgTable("tasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").references(() => projects.id).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").default("todo"), // todo, in-progress, done
    priority: text("priority").default("medium"), // low, medium, high
    assigneeId: uuid("assignee_id").references(() => users.id),
    creatorId: uuid("creator_id").references(() => users.id).notNull(),
    dueDate: timestamp("due_date"),           // Optional deadline
    startedAt: timestamp("started_at"),        // Set when status → in-progress
    completedAt: timestamp("completed_at"),    // Set when status → done
    estimatedHours: integer("estimated_hours"), // For time tracking
    // Recurring task fields
    recurrenceRule: text("recurrence_rule"), // RRULE format (daily, weekly, monthly, etc.)
    recurrenceEndDate: timestamp("recurrence_end_date"),
    parentRecurringTaskId: uuid("parent_recurring_task_id"), // Link to parent recurring task
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const subTasks = pgTable("sub_tasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").references(() => tasks.id).notNull(),
    title: text("title").notNull(),
    isCompleted: boolean("is_completed").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").references(() => tasks.id).notNull(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    parentId: uuid("parent_id"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
    parentFk: foreignKey({
        columns: [t.parentId],
        foreignColumns: [t.id],
        name: "comments_parent_id_fkey"
    }).onDelete("cascade"),
}));

export const attachments = pgTable("attachments", {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").references(() => tasks.id), // Nullable now, can be project attachment
    projectId: uuid("project_id").references(() => projects.id), // Nullable, can be task attachment
    uploaderId: uuid("user_id").references(() => users.id).notNull(),
    url: text("url").notNull(), // Cloudinary URL
    filename: text("filename").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// Chat
export const chatChannels = pgTable("chat_channels", {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(), // 'project', 'task', 'direct', 'group'
    projectId: uuid("project_id").references(() => projects.id), // Nullable if direct/group
    taskId: uuid("task_id").references(() => tasks.id), // Nullable if not task chat
    name: text("name"), // For group chats
    createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    channelId: uuid("channel_id").references(() => chatChannels.id).notNull(),
    senderId: uuid("user_id").references(() => users.id).notNull(),
    content: text("content").notNull(), // Encrypted content
    createdAt: timestamp("created_at").defaultNow(),
});

// Analytics
export const activityLogs = pgTable("activity_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    action: text("action").notNull(), // 'create_task', 'complete_task', 'create_project'
    entityId: uuid("entity_id").notNull(), // ID of the task/project
    entityType: text("entity_type").notNull(), // 'task', 'project'
    metadata: text("metadata"), // JSON string for extra details
    createdAt: timestamp("created_at").defaultNow(),
});

// Task Labels (project-scoped tags)
export const taskLabels = pgTable("task_labels", {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    name: text("name").notNull(),
    color: text("color").notNull(), // Hex color code like #FF5733
    createdAt: timestamp("created_at").defaultNow(),
});

// Task Label Assignments (many-to-many junction)
export const taskLabelAssignments = pgTable("task_label_assignments", {
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
    labelId: uuid("label_id").references(() => taskLabels.id, { onDelete: 'cascade' }).notNull(),
    assignedAt: timestamp("assigned_at").defaultNow(),
}, (t) => ({
    pk: primaryKey({ columns: [t.taskId, t.labelId] }),
}));

// Time Tracking Entries
export const timeEntries = pgTable("time_entries", {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    description: text("description"),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"), // Null if timer is running
    duration: integer("duration"), // Duration in seconds (calculated or for manual entries)
    isManual: boolean("is_manual").default(false), // True if manually entered
    createdAt: timestamp("created_at").defaultNow(),
});

// Task Dependencies (blockers)
export const taskDependencies = pgTable("task_dependencies", {
    dependentTaskId: uuid("dependent_task_id").references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
    dependsOnTaskId: uuid("depends_on_task_id").references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
    dependencyType: text("dependency_type").default("blocks"), // 'blocks', 'related'
    createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
    pk: primaryKey({ columns: [t.dependentTaskId, t.dependsOnTaskId] }),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    projects: many(projects),
    projectMembers: many(projectMembers),
    assignedTasks: many(tasks, { relationName: "task_assignee" }),
    createdTasks: many(tasks, { relationName: "task_creator" }),
    notifications: many(notifications),
    comments: many(comments),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    owner: one(users, {
        fields: [projects.ownerId],
        references: [users.id],
    }),
    members: many(projectMembers),
    tasks: many(tasks),
    attachments: many(attachments),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
    project: one(projects, {
        fields: [projectMembers.projectId],
        references: [projects.id],
    }),
    user: one(users, {
        fields: [projectMembers.userId],
        references: [users.id],
    }),
    role: one(roles, {
        fields: [projectMembers.roleId],
        references: [roles.id],
    }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
    project: one(projects, {
        fields: [tasks.projectId],
        references: [projects.id],
    }),
    assignee: one(users, {
        fields: [tasks.assigneeId],
        references: [users.id],
        relationName: "task_assignee"
    }),
    creator: one(users, {
        fields: [tasks.creatorId],
        references: [users.id],
        relationName: "task_creator"
    }),
    subTasks: many(subTasks),
    comments: many(comments),
    attachments: many(attachments),
    labelAssignments: many(taskLabelAssignments),
    timeEntries: many(timeEntries),
    dependencies: many(taskDependencies, { relationName: "task_dependencies" }),
    blockedBy: many(taskDependencies, { relationName: "task_blockers" }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
    user: one(users, {
        fields: [refreshTokens.userId],
        references: [users.id],
    }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
    task: one(tasks, {
        fields: [comments.taskId],
        references: [tasks.id],
    }),
    user: one(users, {
        fields: [comments.userId],
        references: [users.id],
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
        relationName: "comment_replies"
    }),
    replies: many(comments, {
        relationName: "comment_replies"
    }),
}));

export const subTasksRelations = relations(subTasks, ({ one }) => ({
    task: one(tasks, {
        fields: [subTasks.taskId],
        references: [tasks.id],
    }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
    task: one(tasks, {
        fields: [attachments.taskId],
        references: [tasks.id],
    }),
    project: one(projects, {
        fields: [attachments.projectId],
        references: [projects.id],
    }),
    uploader: one(users, {
        fields: [attachments.uploaderId],
        references: [users.id],
    }),
}));

export const projectInviteLinksRelations = relations(projectInviteLinks, ({ one }) => ({
    project: one(projects, {
        fields: [projectInviteLinks.projectId],
        references: [projects.id],
    }),
    creator: one(users, {
        fields: [projectInviteLinks.createdBy],
        references: [users.id],
    }),
    role: one(roles, {
        fields: [projectInviteLinks.roleId],
        references: [roles.id],
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));

// Task Labels Relations
export const taskLabelsRelations = relations(taskLabels, ({ one, many }) => ({
    project: one(projects, {
        fields: [taskLabels.projectId],
        references: [projects.id],
    }),
    assignments: many(taskLabelAssignments),
}));

export const taskLabelAssignmentsRelations = relations(taskLabelAssignments, ({ one }) => ({
    task: one(tasks, {
        fields: [taskLabelAssignments.taskId],
        references: [tasks.id],
    }),
    label: one(taskLabels, {
        fields: [taskLabelAssignments.labelId],
        references: [taskLabels.id],
    }),
}));

// Time Entries Relations
export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
    task: one(tasks, {
        fields: [timeEntries.taskId],
        references: [tasks.id],
    }),
    user: one(users, {
        fields: [timeEntries.userId],
        references: [users.id],
    }),
}));

// Task Dependencies Relations
export const taskDependenciesRelations = relations(taskDependencies, ({ one }) => ({
    dependentTask: one(tasks, {
        fields: [taskDependencies.dependentTaskId],
        references: [tasks.id],
        relationName: "task_dependencies",
    }),
    dependsOnTask: one(tasks, {
        fields: [taskDependencies.dependsOnTaskId],
        references: [tasks.id],
        relationName: "task_blockers",
    }),
}));
