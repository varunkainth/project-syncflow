import { useState } from "react";
import { Link2, Copy, Check, Users, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { useCreateInviteLink } from "../hooks/useProjects";

const ROLES = [
    {
        id: 4,
        name: "member",
        label: "Member",
        description: "Can create and manage own tasks",
        icon: Users,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
        borderColor: "border-yellow-200 dark:border-yellow-800",
    },
    {
        id: 5,
        name: "contributor",
        label: "Contributor",
        description: "Can edit existing tasks",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800",
    },
    {
        id: 6,
        name: "viewer",
        label: "Viewer",
        description: "Read-only access",
        icon: Eye,
        color: "text-gray-600 dark:text-gray-400",
        bgColor: "bg-gray-50 dark:bg-gray-950/30",
        borderColor: "border-gray-200 dark:border-gray-800",
    },
];

interface CreateInviteLinkDialogProps {
    projectId: string;
}

export function CreateInviteLinkDialog({ projectId }: CreateInviteLinkDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(4); // Default to Member
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const createLink = useCreateInviteLink(projectId);

    const handleGenerateLink = () => {
        createLink.mutate(
            {
                roleId: selectedRole,
                expiresInDays: 2, // Automatically expire after 2 days
            },
            {
                onSuccess: (data) => {
                    const fullLink = `${window.location.origin}/projects/join/${data.token}`;
                    setGeneratedLink(fullLink);
                    toast.success("Invite link created successfully!");
                },
                onError: (error) => {
                    toast.error("Failed to create invite link", {
                        description: error.message,
                    });
                },
            }
        );
    };

    const handleCopyLink = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCloseDialog = () => {
        setOpen(false);
        setGeneratedLink(null);
        setCopied(false);
        setSelectedRole(4);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Link2 className="mr-2 h-4 w-4" />
                    Create Invite Link
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Create Invite Link</DialogTitle>
                    <DialogDescription>
                        Generate a shareable link that anyone can use to join this project.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {!generatedLink ? (
                        <>
                            <div className="space-y-3">
                                <Label>Select Role</Label>
                                <RadioGroup
                                    value={selectedRole.toString()}
                                    onValueChange={(value) => setSelectedRole(Number.parseInt(value))}
                                    className="grid gap-3"
                                >
                                    {ROLES.map((role) => {
                                        const Icon = role.icon;
                                        const isSelected = selectedRole === role.id;

                                        return (
                                            <div key={role.id} className="relative">
                                                <RadioGroupItem
                                                    value={role.id.toString()}
                                                    id={`link-${role.name}`}
                                                    className="peer sr-only"
                                                />
                                                <Label
                                                    htmlFor={`link-${role.name}`}
                                                    className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all
                                                        ${isSelected ? `${role.borderColor} ${role.bgColor}` : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm'}
                                                    `}
                                                >
                                                    <div className={`p-2 rounded-md ${role.bgColor}`}>
                                                        <Icon className={`h-5 w-5 ${role.color}`} />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="font-medium">{role.label}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {role.description}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className={`p-1 rounded-full ${role.bgColor}`}>
                                                            <Check className={`h-4 w-4 ${role.color}`} />
                                                        </div>
                                                    )}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </RadioGroup>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>Note:</strong> For security, you can only create invite links for Member, Contributor, or Viewer roles. Admin and Owner access must be granted directly.
                                </p>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={handleCloseDialog}>
                                    Cancel
                                </Button>
                                <Button onClick={handleGenerateLink} disabled={createLink.isPending}>
                                    {createLink.isPending ? "Generating..." : "Generate Link"}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Shareable Link</Label>
                                <div className="flex gap-2">
                                    <Input value={generatedLink} readOnly className="flex-1" />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCopyLink}
                                        className="shrink-0"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Share this link with anyone you want to invite to the project. They'll join as a {ROLES.find(r => r.id === selectedRole)?.label}.
                                </p>
                            </div>

                            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    <strong>Link created successfully!</strong> Anyone with this link can join your project. The link will expire in 2 days.
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleCloseDialog}>
                                    Done
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
