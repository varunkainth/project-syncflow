import { useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Check, X, User, Briefcase, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { useInvitationDetails, useAcceptInvitation, useDeclineInvitation } from "../hooks/useProjects";

export function InvitationDetailsPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    const { data: invitation, isLoading, isError, error } = useInvitationDetails(projectId || "");
    const acceptInvitation = useAcceptInvitation();
    const declineInvitation = useDeclineInvitation();

    const handleAccept = () => {
        if (!projectId) return;

        acceptInvitation.mutate(projectId, {
            onSuccess: () => {
                toast.success("Invitation accepted!", {
                    description: `You've joined ${invitation?.project.name}`,
                });
                navigate(`/projects/${projectId}`);
            },
            onError: (error) => {
                const errorMessage = axios.isAxiosError(error)
                    ? error.response?.data?.error
                    : "Failed to accept invitation";
                toast.error("Error", { description: errorMessage });
            },
        });
    };

    const handleDecline = () => {
        if (!projectId) return;

        declineInvitation.mutate(projectId, {
            onSuccess: () => {
                toast.success("Invitation declined");
                navigate("/projects");
            },
            onError: (error) => {
                const errorMessage = axios.isAxiosError(error)
                    ? error.response?.data?.error
                    : "Failed to decline invitation";
                toast.error("Error", { description: errorMessage });
            },
        });
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading invitation details...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.error
            : "Failed to load invitation";

        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
                            <X className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle>Invitation Not Found</CardTitle>
                        <CardDescription>{errorMessage}</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button onClick={() => navigate("/projects")}>
                            Go to Projects
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (!invitation) return null;

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case "active": return "bg-green-500/10 text-green-500";
            case "archived": return "bg-gray-500/10 text-gray-500";
            case "completed": return "bg-blue-500/10 text-blue-500";
            case "on_hold": return "bg-yellow-500/10 text-yellow-500";
            default: return "bg-primary/10 text-primary";
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role.toLowerCase()) {
            case "owner": return "destructive";
            case "admin": return "default";
            case "member": return "secondary";
            case "viewer": return "outline";
            default: return "secondary";
        }
    };

    return (
        <div className="container max-w-2xl py-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Project Invitation</h1>
                <p className="text-muted-foreground">
                    You've been invited to join a project
                </p>
            </div>

            {/* Project Card */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                            <Briefcase className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold">{invitation.project.name}</h2>
                            {invitation.project.status && (
                                <Badge
                                    variant="outline"
                                    className={`mt-1 ${getStatusColor(invitation.project.status)}`}
                                >
                                    {invitation.project.status.replace("_", " ")}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {invitation.project.description && (
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">
                            {invitation.project.description}
                        </p>
                    </CardContent>
                )}
            </Card>

            {/* Inviter & Role Info */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Inviter Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Invited by</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                                <AvatarImage src={invitation.inviter.avatarUrl || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {invitation.inviter.name?.charAt(0).toUpperCase() ||
                                        invitation.inviter.email.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">
                                    {invitation.inviter.name || "Team Member"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {invitation.inviter.email}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Role Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            <span>Your Role</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Badge
                                variant={getRoleBadgeVariant(invitation.role.name) as any}
                                className="text-base px-3 py-1 capitalize"
                            >
                                {invitation.role.name}
                            </Badge>
                            {invitation.role.description && (
                                <p className="text-sm text-muted-foreground">
                                    {invitation.role.description}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                    Invited {formatDistanceToNow(new Date(invitation.invitedAt), { addSuffix: true })}
                </span>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                    size="lg"
                    onClick={handleAccept}
                    disabled={acceptInvitation.isPending || declineInvitation.isPending}
                    className="min-w-[140px]"
                >
                    {acceptInvitation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Check className="mr-2 h-4 w-4" />
                    )}
                    Accept
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    onClick={handleDecline}
                    disabled={acceptInvitation.isPending || declineInvitation.isPending}
                    className="min-w-[140px]"
                >
                    {declineInvitation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <X className="mr-2 h-4 w-4" />
                    )}
                    Decline
                </Button>
            </div>
        </div>
    );
}
