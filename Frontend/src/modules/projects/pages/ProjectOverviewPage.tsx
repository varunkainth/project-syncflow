import { useOutletContext } from "react-router-dom";
import { Calendar, FolderKanban } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ProjectAttachmentsSection } from "../components/ProjectAttachmentsSection";
import type { Project } from "../schema";

export function ProjectOverviewPage() {
    const { project } = useOutletContext<{ project: Project }>();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Overview</h3>
                <p className="text-sm text-muted-foreground">
                    Project details and statistics.
                </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Status</CardTitle>
                        <CardDescription>Current project status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium capitalize">{project.status || "Active"}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Created At</CardTitle>
                        <CardDescription>Project creation date</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {project.description || "No description provided."}
                    </p>
                </CardContent>
            </Card>

            {/* Project Attachments */}
            <ProjectAttachmentsSection projectId={project.id} />
        </div>
    );
}
