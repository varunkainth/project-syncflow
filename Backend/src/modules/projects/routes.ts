import { Hono } from "hono";
import * as projectController from "./controller";
import { checkPermission } from "../rbac/middleware";

const projects = new Hono();

// Use regular Hono routes for encrypted endpoints
projects.post("/", projectController.createProject);

projects.get("/", projectController.getProjects);
projects.get("/:id", projectController.getProject);
projects.patch("/:id", projectController.updateProject);
projects.delete("/:id", projectController.deleteProject);

// Member management routes
projects.get("/:id/members", projectController.getProjectMembers);
projects.post("/:id/members/invite", projectController.inviteMember);
projects.delete("/:id/members/:userId", projectController.removeMember);
projects.patch("/:id/members/:userId/role", projectController.updateMemberRole);

// Invite link routes
projects.post("/:id/invite-link", projectController.createInviteLink);
projects.post("/join/:token", projectController.joinViaInviteLink);

// Invitation accept/decline routes
projects.get("/:id/invitation", projectController.getInvitationDetails);
projects.post("/:id/invitation/accept", projectController.acceptInvitation);
projects.post("/:id/invitation/decline", projectController.declineInvitation);

// Legacy route (keep for backwards compatibility)
projects.post("/:id/invite", projectController.inviteMember);

export default projects;
