import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, FolderKanban, MoreHorizontal, Download, X, Plus, FileIcon, Loader2, ChevronDown, Users, MessageSquare, Settings } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
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
import { Badge } from "@/components/ui/badge";
import { useProject, useProjectAttachments, useUploadProjectAttachment, useDeleteProjectAttachment, useCurrentUserRole } from "../hooks/useProjects";
import { useUser } from "../../auth/hooks/useUser";

export function ProjectDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { data: user } = useUser();
    const { data: project, isLoading, error } = useProject(id || "");
    const { data: attachments = [], isLoading: isLoadingAttachments } = useProjectAttachments(id || "");
    const uploadAttachment = useUploadProjectAttachment(id || "");
    const deleteAttachment = useDeleteProjectAttachment(id || "");
    const { canEditTasks } = useCurrentUserRole(id || "", user?.id);

    const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;

        uploadAttachment.mutate(file, {
            onSuccess: () => toast.success("File uploaded"),
            onError: () => toast.error("Upload failed"),
        });
        e.target.value = "";
    };

    const handleDeleteAttachment = (attachmentId: string) => {
        if (!confirm("Delete this attachment?")) return;
        deleteAttachment.mutate(attachmentId, {
            onSuccess: () => toast.success("Attachment deleted"),
            onError: () => toast.error("Delete failed"),
        });
    };

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
        <div className="relative min-h-screen flex flex-col">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/10 via-background to-background pointer-events-none" />
            <div className="absolute top-0 right-0 z-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none opacity-50 translate-x-1/2 -translate-y-1/2" />

            <div className="relative z-10 flex-1 space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
                {/* Header Section */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="group -ml-2 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10 rounded-full px-3"
                            asChild
                        >
                            <Link to="/projects" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                <span>Back to Projects</span>
                            </Link>
                        </Button>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-primary/20 bg-background/50 backdrop-blur-sm hover:bg-background/80 hover:border-primary/50">
                                        <MoreHorizontal className="h-4 w-4" />
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

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70">
                                    {project.name}
                                </span>
                            </h1>
                            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                                {project.description || "No description provided."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation - Responsive */}
                <div className="w-full">
                    {/* Mobile/Tablet Dropdown */}
                    <div className="md:hidden w-full">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between bg-card/50 backdrop-blur-sm border-primary/20">
                                    <span className="flex items-center gap-2">
                                        <FolderKanban className="h-4 w-4 text-primary" />
                                        Project Menu
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                                <DropdownMenuItem className="gap-2 bg-primary/10 text-primary focus:bg-primary/20">
                                    <FolderKanban className="h-4 w-4" /> Overview
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                    <FileIcon className="h-4 w-4" /> Tasks
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                    <Users className="h-4 w-4" /> Team
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                    <MessageSquare className="h-4 w-4" /> Chat
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2">
                                    <Settings className="h-4 w-4" /> Settings
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Desktop Pills */}
                    <div className="hidden md:flex items-center gap-2">
                        <Button variant="default" size="sm" className="rounded-full shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-purple-600 border-0">
                            Overview
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50">
                            Tasks
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50">
                            Team
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50">
                            Chat
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50">
                            Settings
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    {/* Main Stats Area */}
                    <div className="col-span-full lg:col-span-4 space-y-6">
                        <div className="grid gap-4 grid-cols-2">
                            <div className="group relative overflow-hidden rounded-2xl border border-primary/10 bg-card/60 p-5 hover:bg-card/80 transition-colors backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative space-y-3">
                                    <div className="inline-flex p-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                                        <FolderKanban className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                                        <p className="text-lg font-bold tracking-tight">Active</p>
                                    </div>
                                </div>
                            </div>
                            <div className="group relative overflow-hidden rounded-2xl border border-primary/10 bg-card/60 p-5 hover:bg-card/80 transition-colors backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative space-y-3">
                                    <div className="inline-flex p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Created</p>
                                        <p className="text-lg font-bold tracking-tight">{new Date(project.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity or Chart Placeholder could go here */}
                    </div>

                    {/* Team Section */}
                    <div className="col-span-full lg:col-span-3">
                        <Card className="h-full border-primary/10 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                                    <span>Team Members</span>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Coming Soon</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="flex -space-x-2 overflow-hidden py-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                            U{i}
                                        </div>
                                    ))}
                                    <div className="inline-block h-10 w-10 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                        +2
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Attachments Section */}
                <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold tracking-tight">Attachments</h3>
                        {canEditTasks && (
                            <label className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-full bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">
                                {uploadAttachment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Upload File
                                <input type="file" className="hidden" onChange={handleUploadFile} disabled={uploadAttachment.isPending} />
                            </label>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {attachments.map(att => (
                            <div key={att.id} className="group relative flex flex-col p-4 rounded-2xl border border-primary/10 bg-card/50 hover:bg-card/80 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary">
                                        <FileIcon className="h-6 w-6" />
                                    </div>
                                    {canEditTasks && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                            onClick={() => handleDeleteAttachment(att.id)}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium truncate text-foreground/90" title={att.filename}>{att.filename}</p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{new Date(att.createdAt).toLocaleDateString()}</span>
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={att.url} target="_blank" rel="noopener noreferrer" download className="flex items-center hover:text-primary">
                                                <Download className="h-3 w-3 mr-1" />
                                                Download
                                            </a>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!isLoadingAttachments && attachments.length === 0 && !canEditTasks && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-dashed border-primary/10 bg-primary/5/30">
                                <div className="p-3 rounded-full bg-muted/50">
                                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="max-w-xs">
                                    <p className="font-medium">No attachments yet</p>
                                    <p className="text-sm text-muted-foreground">Files shared in this project will appear here.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
