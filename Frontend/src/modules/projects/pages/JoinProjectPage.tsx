import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { useJoinViaInviteLink } from "../hooks/useProjects";
import { useUser } from "../../auth/hooks/useUser";

export function JoinProjectPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { data: user, isLoading: userLoading } = useUser();
    const joinProject = useJoinViaInviteLink();

    useEffect(() => {
        // If not authenticated, redirect to login with return URL
        if (!userLoading && !user) {
            const returnUrl = `/projects/join/${token}`;
            navigate(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
            return;
        }

        // If authenticated and have token, try to join
        if (user && token && !joinProject.isSuccess && !joinProject.isPending) {
            joinProject.mutate(token, {
                onSuccess: (data) => {
                    toast.success("Successfully joined project!", {
                        description: `You've joined ${data.projectName} as ${data.roleName}`,
                    });
                    // Redirect to the project
                    navigate(`/projects/${data.projectId}`);
                },
                onError: (error) => {
                    const errorMessage = axios.isAxiosError(error)
                        ? error.response?.data?.error
                        : "An unexpected error occurred";
                        
                    toast.error("Failed to join project", {
                        description: errorMessage,
                    });
                    // Redirect to projects page
                    setTimeout(() => navigate("/projects"), 2000);
                },
            });
        }
    }, [user, userLoading, token, joinProject, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <div>
                    <h2 className="text-xl font-semibold">Joining project...</h2>
                    <p className="text-muted-foreground">Please wait while we add you to the team</p>
                </div>
            </div>
        </div>
    );
}
