import { useState } from "react";
import { useParams } from "react-router-dom";
import { MoreHorizontal, Trash2, UserCog, Crown, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { InviteMemberDialog } from "../components/InviteMemberDialog";
import { CreateInviteLinkDialog } from "../components/CreateInviteLinkDialog";
import { useProjectMembers, useRemoveMember, useUpdateMemberRole } from "../hooks/useProjects";
import { useUser } from "../../auth/hooks/useUser";

const ROLE_COLORS: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    project_manager: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    member: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    contributor: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    guest: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
};

const ROLE_ICONS: Record<string, any> = {
    owner: Crown,
    admin: Shield,
    project_manager: UserCog,
    member: Users,
    contributor: Users,
    viewer: Users,
    guest: Users,
};

const ROLES = [
    { id: 1, name: "owner", label: "Owner" },
    { id: 2, name: "admin", label: "Admin" },
    { id: 3, name: "project_manager", label: "Project Manager" },
    { id: 4, name: "member", label: "Member" },
    { id: 5, name: "contributor", label: "Contributor" },
    { id: 6, name: "viewer", label: "Viewer" },
    { id: 7, name: "guest", label: "Guest" },
];

export function ProjectTeamPage() {
    const { id: projectId } = useParams();
    const { data: currentUser } = useUser();
    const { data: members = [], isLoading } = useProjectMembers(projectId!);
    const removeMember = useRemoveMember(projectId!);
    const updateMemberRole = useUpdateMemberRole(projectId!);

    const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
    const [changingRole, setChangingRole] = useState<{ userId: string; currentRole: string } | null>(null);

    const currentMember = members.find(m => m.userId === currentUser?.id);
    const currentMemberLevel = ROLES.find(r => r.name === currentMember?.roleName)?.id || 999;

    const canManageMember = (memberRole: string) => {
        const memberLevel = ROLES.find(r => r.name === memberRole)?.id || 999;
        // Lower ID = higher level (owner=1, admin=2, etc.), so current level should be LESS than member level
        return currentMemberLevel < memberLevel;
    };

    const handleRemoveMember = () => {
        if (!memberToRemove) return;

        removeMember.mutate(memberToRemove, {
            onSuccess: () => {
                toast.success("Member removed successfully");
                setMemberToRemove(null);
            },
            onError: (error) => {
                toast.error("Failed to remove member", {
                    description: error.message,
                });
            },
        });
    };

    const handleUpdateRole = (newRoleId: number) => {
        if (!changingRole) return;

        updateMemberRole.mutate(
            { userId: changingRole.userId, roleId: newRoleId },
            {
                onSuccess: () => {
                    toast.success("Role updated successfully");
                    setChangingRole(null);
                },
                onError: (error) => {
                    toast.error("Failed to update role", {
                        description: error.message,
                    });
                },
            }
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <p className="text-muted-foreground">Loading team members...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Team Members</h2>
                    <p className="text-muted-foreground">
                        Manage who has access to this project
                    </p>
                </div>
                <div className="flex gap-2">
                    <CreateInviteLinkDialog projectId={projectId!} />
                    <InviteMemberDialog projectId={projectId!} />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No team members yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member) => {
                                const RoleIcon = ROLE_ICONS[member.roleName] || Users;
                                const canManage = canManageMember(member.roleName);
                                const isCurrentUser = member.userId === currentUser?.id;

                                return (
                                    <TableRow key={member.userId}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={member.avatarUrl} />
                                                    <AvatarFallback>
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">
                                                        {member.name}
                                                        {isCurrentUser && (
                                                            <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {member.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge className={ROLE_COLORS[member.roleName] || ""}>
                                                    <RoleIcon className="mr-1 h-3 w-3" />
                                                    {ROLES.find(r => r.name === member.roleName)?.label || member.roleName}
                                                </Badge>
                                                {member.status === 'pending' && (
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800">
                                                        Pending
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell>
                                            {canManage && !isCurrentUser && member.status === 'active' && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setChangingRole({ userId: member.userId, currentRole: member.roleName })}
                                                        >
                                                            <UserCog className="mr-2 h-4 w-4" />
                                                            Change Role
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setMemberToRemove(member.userId)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove Member
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                            {canManage && !isCurrentUser && member.status === 'pending' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    onClick={() => setMemberToRemove(member.userId)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Cancel Invitation
                                                </Button>
                                            )}
                                            {!canManage && member.status === 'pending' && (
                                                <span className="text-xs text-muted-foreground italic">
                                                    Awaiting acceptance
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Remove Member Dialog */}
            <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {members?.find(m => m.userId === memberToRemove)?.status === 'pending'
                                ? 'Cancel invitation?'
                                : 'Remove team member?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {members?.find(m => m.userId === memberToRemove)?.status === 'pending'
                                ? 'This will cancel the pending invitation. The user will not be able to join the project using this invitation.'
                                : 'This member will lose access to this project. This action cannot be undone.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveMember}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {members?.find(m => m.userId === memberToRemove)?.status === 'pending'
                                ? 'Cancel Invitation'
                                : 'Remove'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Change Role Dialog */}
            <AlertDialog open={!!changingRole} onOpenChange={() => setChangingRole(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Change member role</AlertDialogTitle>
                        <AlertDialogDescription>
                            Select a new role for this team member.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Select onValueChange={(value) => handleUpdateRole(Number.parseInt(value))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select new role" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.filter(role => canManageMember(role.name) && role.name !== 'owner').map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                        {role.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
