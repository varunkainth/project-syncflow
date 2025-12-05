import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Crown, Shield, UserCog, Users, Eye, Clock, Check } from "lucide-react";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import { useInviteMember } from "../hooks/useProjects";

const inviteSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    roleId: z.number().min(1, "Please select a role"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

// Role data with descriptions and icons
const ROLES = [
    {
        id: 1,
        name: "owner",
        label: "Owner",
        description: "Full control over project including deletion",
        icon: Crown,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-950/30",
        borderColor: "border-purple-200 dark:border-purple-800",
        canAssign: true,
        disabled: true // Can't invite as owner
    },
    {
        id: 2,
        name: "admin",
        label: "Admin",
        description: "Manage members and project settings",
        icon: Shield,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800",
        canAssign: true,
        disabled: true // Max role is member
    },
    {
        id: 3,
        name: "project_manager",
        label: "Project Manager",
        description: "Assign tasks and manage workflows",
        icon: UserCog,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-950/30",
        borderColor: "border-green-200 dark:border-green-800",
        canAssign: true,
        disabled: true // Max role is member
    },
    {
        id: 4,
        name: "member",
        label: "Member",
        description: "Create and manage own tasks",
        icon: Users,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        canAssign: true,
        disabled: false
    },
    {
        id: 5,
        name: "contributor",
        label: "Contributor",
        description: "Edit existing tasks but not create new ones",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800",
        canAssign: true,
        disabled: false
    },
    {
        id: 6,
        name: "viewer",
        label: "Viewer",
        description: "Read-only access (cannot be assigned tasks)",
        icon: Eye,
        color: "text-gray-600 dark:text-gray-400",
        bgColor: "bg-gray-50 dark:bg-gray-950/30",
        borderColor: "border-gray-200 dark:border-gray-800",
        canAssign: false,
        disabled: false
    },
    {
        id: 7,
        name: "guest",
        label: "Guest",
        description: "Temporary read-only access with expiration",
        icon: Clock,
        color: "text-pink-600 dark:text-pink-400",
        bgColor: "bg-pink-50 dark:bg-pink-950/30",
        borderColor: "border-pink-200 dark:border-pink-800",
        canAssign: false,
        disabled: false
    },
];

interface InviteMemberDialogProps {
    projectId: string;
}

export function InviteMemberDialog({ projectId }: InviteMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const inviteMember = useInviteMember(projectId);

    const form = useForm<InviteFormValues>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            email: "",
            roleId: 4, // Default to Member
        },
    });

    function onSubmit(data: InviteFormValues) {
        inviteMember.mutate(data, {
            onSuccess: () => {
                toast.success("Member invited successfully", {
                    description: `An invitation has been sent to ${data.email}`,
                });
                setOpen(false);
                form.reset();
            },
            onError: (error) => {
                toast.error("Failed to invite member", {
                    description: error.message,
                });
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Send an invitation to join this project. Choose their role carefully.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="colleague@example.com"
                                            type="email"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="roleId"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Select Role</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={(value) => field.onChange(Number.parseInt(value))}
                                            value={field.value?.toString()}
                                            className="grid gap-3"
                                        >
                                            {ROLES.map((role) => {
                                                const Icon = role.icon;
                                                const isSelected = field.value === role.id;

                                                return (
                                                    <div key={role.id} className="relative">
                                                        <RadioGroupItem
                                                            value={role.id.toString()}
                                                            id={role.name}
                                                            className="peer sr-only"
                                                            disabled={role.disabled}
                                                        />
                                                        <Label
                                                            htmlFor={role.name}
                                                            className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all
                                                                ${isSelected ? `${role.borderColor} ${role.bgColor}` : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}
                                                                ${role.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
                                                            `}
                                                        >
                                                            <div className={`p-2 rounded-md ${role.bgColor}`}>
                                                                <Icon className={`h-5 w-5 ${role.color}`} />
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium">{role.label}</p>
                                                                    {role.disabled && (
                                                                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                                                                            Not available
                                                                        </span>
                                                                    )}
                                                                    {!role.canAssign && !role.disabled && (
                                                                        <span className="text-xs text-amber-600 dark:text-amber-400 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 rounded">
                                                                            Cannot be assigned
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {role.description}
                                                                </p>
                                                            </div>
                                                            {isSelected && !role.disabled && (
                                                                <div className={`p-1 rounded-full ${role.bgColor}`}>
                                                                    <Check className={`h-4 w-4 ${role.color}`} />
                                                                </div>
                                                            )}
                                                        </Label>
                                                    </div>
                                                );
                                            })}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={inviteMember.isPending}>
                                {inviteMember.isPending ? "Sending..." : "Send Invitation"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
