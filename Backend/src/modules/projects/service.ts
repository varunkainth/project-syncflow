import { db } from "../../db/index";
import { projects, projectMembers, users, roles, permissions, rolePermissions, tasks, projectInviteLinks, activityLogs, attachments } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendEmail } from "../notifications/email.service";
import { projectInviteTemplate } from "../notifications/templates";
import { AnalyticsService } from "../analytics/service";
import { CacheService } from "../../common/cache.service";

const analyticsService = new AnalyticsService();
const cacheService = new CacheService();

export class ProjectService {
    async createProject(userId: string, name: string, description?: string) {
        const [project] = await db.insert(projects).values({
            ownerId: userId,
            name,
            description,
        }).returning();

        if (!project) {
            throw new Error("Failed to create project");
        }

        // Ensure 'owner' role exists
        let ownerRole = await db.query.roles.findFirst({ where: eq(roles.name, "owner") });
        if (!ownerRole) {
            [ownerRole] = await db.insert(roles).values({ name: "owner", description: "Project Owner" }).returning();
        }

        if (!ownerRole) {
            throw new Error("Failed to ensure owner role");
        }

        // Ensure 'task:create' permission exists (and others needed for tests)
        const perms = ["task:create", "task:update", "task:delete", "task:comment", "project:invite"];
        for (const permName of perms) {
            let perm = await db.query.permissions.findFirst({ where: eq(permissions.name, permName) });
            if (!perm) {
                [perm] = await db.insert(permissions).values({ name: permName }).returning();
            }

            if (!perm) {
                throw new Error(`Failed to ensure permission: ${permName}`);
            }
            // Assign to owner role if not exists
            const rolePerm = await db.query.rolePermissions.findFirst({
                where: and(eq(rolePermissions.roleId, ownerRole.id), eq(rolePermissions.permissionId, perm.id))
            });
            if (!rolePerm) {
                await db.insert(rolePermissions).values({
                    roleId: ownerRole.id,
                    permissionId: perm.id,
                });
            }
        }

        // Assign creator as owner with active status
        await db.insert(projectMembers).values({
            projectId: project.id,
            userId: userId,
            roleId: ownerRole.id,
            status: 'active', // Owner is immediately active, not pending
        });

        // Log activity
        await analyticsService.logActivity(userId, "create_project", project.id, "project", JSON.stringify({ name }));

        // Invalidate user's project list cache
        await cacheService.invalidatePattern(`projects:${userId}`);

        return project;
    }

    async getProjects(userId: string) {
        const cacheKey = `projects:${userId}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return cached as any[]; // Return cached data
        }

        // Get projects owned by user
        const ownedProjects = await db.query.projects.findMany({
            where: eq(projects.ownerId, userId),
        });

        // Get projects where user is an active member
        const memberRecords = await db.query.projectMembers.findMany({
            where: and(
                eq(projectMembers.userId, userId),
                eq(projectMembers.status, 'active')
            ),
            with: {
                project: true,
            },
        });

        // Extract projects from member records
        const memberProjects = memberRecords
            .map(m => m.project)
            .filter(p => p.ownerId !== userId); // Exclude owned projects (already in ownedProjects)

        // Combine and return unique projects
        const result = [...ownedProjects, ...memberProjects];

        // Cache the result
        await cacheService.set(cacheKey, result);

        return result;
    }

    async getProjectById(projectId: string, userId: string) {
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
        });

        if (!project) {
            return null;
        }

        // Check if user is owner
        if (project.ownerId === userId) {
            return project;
        }

        // Check if user is a member
        const member = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, userId)
            ),
        });

        if (member) {
            return project;
        }

        return null;
    }

    async updateProject(projectId: string, userId: string, data: { name?: string; description?: string; status?: string }) {
        const project = await this.getProjectById(projectId, userId);
        if (!project) {
            throw new Error("Project not found or access denied");
        }

        // Only owner can update details for now (can be expanded to admin role)
        if (project.ownerId !== userId) {
            throw new Error("Only owner can update project details");
        }

        // Filter out undefined values
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.status !== undefined) updateData.status = data.status;

        if (Object.keys(updateData).length === 0) {
            return project;
        }

        const [updatedProject] = await db.update(projects)
            .set(updateData)
            .where(eq(projects.id, projectId))
            .returning();

        await analyticsService.logActivity(userId, "update_project", projectId, "project", JSON.stringify(updateData));

        return updatedProject;
    }

    async deleteProject(projectId: string, userId: string) {
        const project = await this.getProjectById(projectId, userId);
        if (!project) {
            throw new Error("Project not found or access denied");
        }

        if (project.ownerId !== userId) {
            throw new Error("Only owner can delete project");
        }

        // Cascade delete
        // 1. Delete tasks
        await db.delete(tasks).where(eq(tasks.projectId, projectId));

        // 2. Delete members
        await db.delete(projectMembers).where(eq(projectMembers.projectId, projectId));

        // 3. Delete project
        await db.delete(projects).where(eq(projects.id, projectId));

        await analyticsService.logActivity(userId, "delete_project", projectId, "project", "Project deleted");

        // Invalidate cache
        await cacheService.invalidatePattern(`projects:${userId}`);

        return true;
    }

    async getProjectMembers(projectId: string) {
        const members = await db.query.projectMembers.findMany({
            where: eq(projectMembers.projectId, projectId),
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
                role: {
                    columns: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        });

        return members.map(m => ({
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            avatarUrl: m.user.avatarUrl,
            roleId: m.role.id,
            roleName: m.role.name,
            roleDescription: m.role.description,
            status: m.status,
            joinedAt: m.joinedAt,
        }));
    }

    async inviteMember(projectId: string, inviterUserId: string, inviteeEmail: string, roleId: number) {
        const { canManageRole } = await import("../rbac/roleHierarchy");

        // Get inviter's role
        const inviterMember = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, inviterUserId)
            ),
            with: { role: true },
        });

        if (!inviterMember) {
            throw new Error("You are not a member of this project");
        }

        // Get target role
        const targetRole = await db.query.roles.findFirst({
            where: eq(roles.id, roleId),
        });

        if (!targetRole) {
            throw new Error("Invalid role");
        }

        // Check if inviter can manage this role
        if (!canManageRole(inviterMember.role.name, targetRole.name)) {
            throw new Error(`You do not have permission to invite members as '${targetRole.name}'`);
        }

        // Find or create user
        let invitee = await db.query.users.findFirst({
            where: eq(users.email, inviteeEmail),
        });

        if (!invitee) {
            // Create placeholder user (they'll set password on first login)
            [invitee] = await db.insert(users).values({
                email: inviteeEmail,
                name: inviteeEmail.split('@')[0], // Default name from email
                password: '', // Will be set on first login
            }).returning();
        }

        if (!invitee) {
            throw new Error("Failed to create user");
        }

        // Check if already a member
        const existingMember = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, invitee.id)
            ),
        });

        if (existingMember) {
            throw new Error("User is already a member of this project");
        }

        // Add to project with pending status
        await db.insert(projectMembers).values({
            projectId,
            userId: invitee.id,
            roleId,
            status: 'pending', // Invitation is pending until accepted
        });

        // Send invitation email
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
        });

        if (project) {
            const inviter = await db.query.users.findFirst({
                where: eq(users.id, inviterUserId),
            });

            if (inviter) {
                await sendEmail(
                    inviteeEmail,
                    `You've been invited to join ${project.name}`,
                    projectInviteTemplate(project.name, inviter.name, targetRole.name)
                );

                // Create notification for invited user
                const { NotificationService } = await import("../notifications/service");
                const notificationService = new NotificationService();
                await notificationService.createNotification(
                    invitee.id,
                    "invite",
                    `Invited to ${project.name}`,
                    `${inviter.name} invited you to join ${project.name} as ${targetRole.name}`,
                    `/invitations/${projectId}`,
                    "project",
                    projectId
                );
            }
        }

        await analyticsService.logActivity(inviterUserId, "invite_member", projectId, "project", `Invited ${inviteeEmail} as ${targetRole.name}`);

        return { userId: invitee.id, email: inviteeEmail, role: targetRole.name };
    }

    async removeMember(projectId: string, removerUserId: string, memberUserId: string) {
        const { hasHigherRole } = await import("../rbac/roleHierarchy");

        // Cannot remove self
        if (removerUserId === memberUserId) {
            throw new Error("You cannot remove yourself from the project");
        }

        // Get remover's role
        const removerMember = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, removerUserId)
            ),
            with: { role: true },
        });

        if (!removerMember) {
            throw new Error("You are not a member of this project");
        }

        // Get member to remove
        const targetMember = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, memberUserId)
            ),
            with: { role: true, user: true },
        });

        if (!targetMember) {
            throw new Error("Member not found in this project");
        }

        // Cannot remove owner
        if (targetMember.role.name === 'owner') {
            throw new Error("Cannot remove project owner");
        }

        // Check role hierarchy
        if (!hasHigherRole(removerMember.role.name, targetMember.role.name)) {
            throw new Error("You do not have permission to remove this member");
        }

        // Remove member
        await db.delete(projectMembers).where(
            and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, memberUserId)
            )
        );

        await analyticsService.logActivity(removerUserId, "remove_member", projectId, "project", `Removed ${targetMember.user.email}`);

        // Invalidate Member's project cache (they assume they are no longer in it)
        await cacheService.invalidatePattern(`projects:${memberUserId}`);

        return true;
    }

    async updateMemberRole(projectId: string, updaterUserId: string, memberUserId: string, newRoleId: number) {
        const { canManageRole } = await import("../rbac/roleHierarchy");

        // Get updater's role
        const updaterMember = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, updaterUserId)
            ),
            with: { role: true },
        });

        if (!updaterMember) {
            throw new Error("You are not a member of this project");
        }

        // Get member to update
        const targetMember = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, memberUserId)
            ),
            with: { role: true, user: true },
        });

        if (!targetMember) {
            throw new Error("Member not found in this project");
        }

        // Get new role
        const newRole = await db.query.roles.findFirst({
            where: eq(roles.id, newRoleId),
        });

        if (!newRole) {
            throw new Error("Invalid role");
        }

        // Cannot change owner role
        if (targetMember.role.name === 'owner') {
            throw new Error(`Cannot change role of project owner (${targetMember.user.name})`);
        }
        if (newRole.name === 'owner') {
            throw new Error("Cannot assign owner role to a member");
        }

        // Cannot change your own role
        if (updaterUserId === memberUserId) {
            throw new Error("You cannot change your own role");
        }

        // Check if updater can manage both current and new role
        if (!canManageRole(updaterMember.role.name, targetMember.role.name) ||
            !canManageRole(updaterMember.role.name, newRole.name)) {
            throw new Error("You do not have permission to change this member's role");
        }

        // Update role
        await db.update(projectMembers)
            .set({ roleId: newRoleId })
            .where(
                and(
                    eq(projectMembers.projectId, projectId),
                    eq(projectMembers.userId, memberUserId)
                )
            );

        await analyticsService.logActivity(updaterUserId, "update_member_role", projectId, "project", `Changed ${targetMember.user.email} role to ${newRole.name}`);

        return { userId: memberUserId, newRole: newRole.name };
    }

    async createInviteLink(projectId: string, creatorUserId: string, roleId: number, maxUses?: number, expiresInDays?: number) {
        const { canManageRole } = await import("../rbac/roleHierarchy");

        // Get creator's role
        const creatorMember = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, creatorUserId)
            ),
            with: { role: true },
        });

        if (!creatorMember) {
            throw new Error("You are not a member of this project");
        }

        // Get target role
        const targetRole = await db.query.roles.findFirst({
            where: eq(roles.id, roleId),
        });

        if (!targetRole) {
            throw new Error("Invalid role");
        }

        // Check if creator can manage this role
        if (!canManageRole(creatorMember.role.name, targetRole.name)) {
            throw new Error(`You do not have permission to create invite links for role '${targetRole.name}'`);
        }

        // Generate unique token
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

        // Calculate expiration
        const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

        // Create invite link
        const [inviteLink] = await db.insert(projectInviteLinks).values({
            projectId,
            createdBy: creatorUserId,
            token,
            roleId,
            maxUses: maxUses || null,
            expiresAt,
        }).returning();

        await analyticsService.logActivity(creatorUserId, "create_invite_link", projectId, "project", `Created invite link for role ${targetRole.name}`);

        return {
            id: inviteLink.id,
            token: inviteLink.token,
            roleId: inviteLink.roleId,
            roleName: targetRole.name,
            maxUses: inviteLink.maxUses,
            usesCount: inviteLink.usesCount,
            expiresAt: inviteLink.expiresAt,
            createdAt: inviteLink.createdAt,
        };
    }

    async joinViaInviteLink(token: string, userId: string) {
        // Find invite link
        const inviteLink = await db.query.projectInviteLinks.findFirst({
            where: eq(projectInviteLinks.token, token),
            with: {
                project: true,
                role: true,
            },
        });

        if (!inviteLink) {
            throw new Error("Invalid or expired invite link");
        }

        // Check if expired
        if (inviteLink.expiresAt && new Date(inviteLink.expiresAt) < new Date()) {
            throw new Error("This invite link has expired");
        }

        // Check max uses
        if (inviteLink.maxUses && inviteLink.usesCount >= inviteLink.maxUses) {
            throw new Error("This invite link has reached its maximum uses");
        }

        // Check if user is already a member
        const existingMember = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, inviteLink.projectId),
                eq(projectMembers.userId, userId)
            ),
        });

        if (existingMember) {
            throw new Error("You are already a member of this project");
        }

        // Add user to project with active status (link clicked = accepted)
        await db.insert(projectMembers).values({
            projectId: inviteLink.projectId,
            userId,
            roleId: inviteLink.roleId,
            status: 'active', // Clicking invite link means they accept immediately
        });

        // Increment uses count
        await db.update(projectInviteLinks)
            .set({ usesCount: inviteLink.usesCount + 1 })
            .where(eq(projectInviteLinks.id, inviteLink.id));

        await analyticsService.logActivity(userId, "join_via_invite_link", inviteLink.projectId, "project", `Joined project via invite link`);

        // Invalidate project list cache
        await cacheService.invalidatePattern(`projects:${userId}`);

        return {
            projectId: inviteLink.projectId,
            projectName: inviteLink.project.name,
            roleName: inviteLink.role.name,
        };
    }

    async acceptInvitation(projectId: string, userId: string) {
        const member = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, userId)
            ),
        });

        if (!member) {
            throw new Error("Invitation not found");
        }

        if (member.status === 'active') {
            throw new Error("You are already an active member");
        }

        if (member.status === 'declined') {
            throw new Error("You have declined this invitation");
        }

        // Update status to active
        await db.update(projectMembers)
            .set({ status: 'active' })
            .where(
                and(
                    eq(projectMembers.projectId, projectId),
                    eq(projectMembers.userId, userId)
                )
            );

        await analyticsService.logActivity(userId, "accept_invitation", projectId, "project", "Accepted invitation");

        // Invalidate cache
        await cacheService.invalidatePattern(`projects:${userId}`);

        return { projectId, status: 'active' };
    }

    async declineInvitation(projectId: string, userId: string) {
        const member = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, userId)
            ),
        });

        if (!member) {
            throw new Error("Invitation not found");
        }

        if (member.status === 'active') {
            throw new Error("Cannot decline - you are already an active member");
        }

        // Remove the invitation
        await db.delete(projectMembers).where(
            and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, userId)
            )
        );

        await analyticsService.logActivity(userId, "decline_invitation", projectId, "project", "Declined invitation");

        return { projectId, status: 'declined' };
    }

    async getInvitationDetails(projectId: string, userId: string) {
        // Get the member record (invitation)
        const member = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, userId)
            ),
            with: {
                role: true,
            },
        });

        if (!member) {
            throw new Error("Invitation not found");
        }

        if (member.status === 'active') {
            throw new Error("You are already an active member of this project");
        }

        // Get project details
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
            with: {
                owner: {
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        if (!project) {
            throw new Error("Project not found");
        }

        // Try to find who invited this user from activity logs
        const inviteLog = await db.query.activityLogs.findFirst({
            where: and(
                eq(activityLogs.entityId, projectId),
                eq(activityLogs.action, "invite_member")
            ),
            orderBy: [desc(activityLogs.createdAt)],
        });

        let inviter = project.owner; // Default to project owner

        if (inviteLog) {
            const inviterUser = await db.query.users.findFirst({
                where: eq(users.id, inviteLog.userId),
                columns: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            });
            if (inviterUser) {
                inviter = inviterUser;
            }
        }

        return {
            project: {
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status,
            },
            inviter: {
                id: inviter.id,
                name: inviter.name,
                email: inviter.email,
                avatarUrl: inviter.avatarUrl,
            },
            role: {
                id: member.role.id,
                name: member.role.name,
                description: member.role.description,
            },
            invitationStatus: member.status,
            invitedAt: member.joinedAt,
        };
    }

    async addAttachment(projectId: string, userId: string, url: string, filename: string) {
        const { hasHigherRole } = await import("../rbac/roleHierarchy");

        const member = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, userId)
            ),
            with: { role: true },
        });

        if (!member) {
            throw new Error("You are not a member of this project");
        }

        const roleName = member.role.name.toLowerCase();
        if (roleName !== 'owner' && roleName !== 'admin') {
            throw new Error("Only owners and admins can upload project files");
        }

        const [attachment] = await db.insert(attachments).values({
            projectId,
            uploaderId: userId,
            url,
            filename,
        }).returning();

        const uploader = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { name: true }
        });

        await analyticsService.logActivity(userId, "upload_project_attachment", projectId, "project", `Uploaded ${filename}`);

        await cacheService.invalidatePattern(`projects:${projectId}:attachments`);

        return { ...attachment, uploaderName: uploader?.name };
    }

    async removeAttachment(projectId: string, userId: string, attachmentId: string) {
        const member = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, userId)
            ),
            with: { role: true },
        });

        if (!member) {
            throw new Error("You are not a member of this project");
        }

        const roleName = member.role.name.toLowerCase();
        if (roleName !== 'owner' && roleName !== 'admin') {
            throw new Error("Only owners and admins can delete project files");
        }

        const attachment = await db.query.attachments.findFirst({
            where: and(
                eq(attachments.id, attachmentId),
                eq(attachments.projectId, projectId)
            )
        });

        if (!attachment) {
            throw new Error("Attachment not found");
        }

        await db.delete(attachments).where(eq(attachments.id, attachmentId));

        await analyticsService.logActivity(userId, "delete_project_attachment", projectId, "project", `Deleted ${attachment.filename}`);

        await cacheService.invalidatePattern(`projects:${projectId}:attachments`);

        return true;
    }

    async getAttachments(projectId: string, userId: string) {
        // Check membership
        const member = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, userId)
            )
        });

        if (!member) {
            throw new Error("You are not a member of this project");
        }

        const cacheKey = `projects:${projectId}:attachments`;
        const cached = await cacheService.get(cacheKey);
        if (cached) return cached;

        const files = await db.query.attachments.findMany({
            where: eq(attachments.projectId, projectId),
            with: {
                uploader: {
                    columns: { id: true, name: true, avatarUrl: true }
                }
            },
            orderBy: (att, { desc }) => [desc(att.createdAt)]
        });

        await cacheService.set(cacheKey, files);

        return files;
    }
}

