import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, FolderKanban, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProject } from "../hooks/useProjects";

export function ProjectDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { data: project, isLoading, error } = useProject(id || "");

    if (isLoading) {
        return <div className="p-8">Loading project details...</div>;
    }

    if (error || !project) {
        return (
            <div className="p-8 flex flex-col items-center justify-center space-y-4">
                <h2 className="text-2xl font-bold">Project not found</h2>
                <p className="text-muted-foreground">
                    The project you are looking for does not exist or you don't have permission to view it.
                </p>
                <Button asChild>
                    <Link to="/projects">Back to Projects</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/projects">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
                        <p className="text-muted-foreground">
                            {project.description || "No description provided."}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <MoreHorizontal className="mr-2 h-4 w-4" />
                                Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Project</DropdownMenuItem>
                            <DropdownMenuItem>Manage Members</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                                Delete Project
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>
                            Project details and statistics.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex items-center space-x-2">
                                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Status: Active</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    Created: {new Date(project.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>
                            People working on this project.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Member management coming soon...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
