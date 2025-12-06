import { useState, useMemo } from "react";
import { FolderKanban, Calendar, Crown, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateProjectDialog } from "../components/CreateProjectDialog";
import { useProjects } from "../hooks/useProjects";
import { useUser } from "../../auth/hooks/useUser";

type FilterType = "all" | "owned" | "joined";

export function ProjectsPage() {
    // ... existing hooks ...
    const { data: projects, isLoading } = useProjects();
    const { data: user } = useUser();
    const [filter, setFilter] = useState<FilterType>("all");

    // ... existing useMemos ...
    const filteredProjects = useMemo(() => {
        if (!projects || !user) return [];

        switch (filter) {
            case "owned":
                return projects.filter(p => p.ownerId === user.id);
            case "joined":
                return projects.filter(p => p.ownerId !== user.id);
            default:
                return projects;
        }
    }, [projects, user, filter]);

    const counts = useMemo(() => {
        if (!projects || !user) return { all: 0, owned: 0, joined: 0 };
        return {
            all: projects.length,
            owned: projects.filter(p => p.ownerId === user.id).length,
            joined: projects.filter(p => p.ownerId !== user.id).length,
        };
    }, [projects, user]);

    return (
        <div className="flex-1 space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Projects</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your projects and collaborate with your team.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <CreateProjectDialog />
                </div>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)} className="w-full">
                <TabsList className="grid w-full sm:w-auto sm:max-w-md grid-cols-3">
                    <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        All
                        {!isLoading && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs hidden sm:inline-flex">{counts.all}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="owned" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden xs:inline">Owned</span>
                        {!isLoading && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs hidden sm:inline-flex">{counts.owned}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="joined" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden xs:inline">Joined</span>
                        {!isLoading && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs hidden sm:inline-flex">{counts.joined}</Badge>}
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    // Skeleton Loading State
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="flex flex-col overflow-hidden border-border/50">
                            <CardHeader className="space-y-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/4" />
                                <div className="space-y-1 pt-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <Skeleton className="h-4 w-1/3" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-4 w-1/2" />
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <>
                        {filteredProjects?.map((project) => {
                            const isOwner = project.ownerId === user?.id;

                            return (
                                <Card key={project.id} className="group flex flex-col transition-all duration-300 hover:shadow-lg hover:border-primary/50 overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                        <div className="space-y-1 w-full">
                                            <div className="flex items-center justify-between w-full">
                                                <CardTitle className="line-clamp-1">
                                                    <Link to={`/projects/${project.id}`} className="hover:text-primary transition-colors flex items-center gap-2">
                                                        <span className="hidden group-hover:block transition-all duration-300 text-primary">#</span>
                                                        {project.name}
                                                    </Link>
                                                </CardTitle>
                                                {/* Ownership Badge */}
                                                {isOwner ? (
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 shrink-0">
                                                        <Crown className="h-3 w-3" />
                                                        Owner
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 shrink-0">
                                                        <Users className="h-3 w-3" />
                                                        Member
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardDescription className="line-clamp-2 min-h-0 sm:min-h-[40px] text-xs sm:text-sm mt-1">
                                                {project.description || "No description provided."}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 pb-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground bg-muted/50 w-fit px-2 py-1 rounded-md">
                                            <FolderKanban className="mr-2 h-4 w-4 text-primary" />
                                            <span>Active Project</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-2 border-t bg-muted/20">
                                        <div className="flex items-center text-xs text-muted-foreground w-full justify-between">
                                            <div className="flex items-center rounded-full bg-background px-2 py-1 border shadow-sm">
                                                <Calendar className="mr-1.5 h-3 w-3" />
                                                {new Date(project.createdAt).toLocaleDateString()}
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                                <Link to={`/projects/${project.id}`}>
                                                    View Details &rarr;
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            );
                        })}

                        {filteredProjects?.length === 0 && (
                            <div className="col-span-full flex min-h-[300px] sm:min-h-[500px] shrink-0 items-center justify-center rounded-xl border border-dashed border-primary/20 bg-muted/5/50 backdrop-blur-sm">
                                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center p-8">
                                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-4 ring-primary/5 shadow-2xl animate-in zoom-in-50 duration-500">
                                        <FolderKanban className="h-12 w-12 text-primary" />
                                    </div>
                                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                                        {filter === "all"
                                            ? "No projects created yet"
                                            : filter === "owned"
                                                ? "No projects owned"
                                                : "No projects joined"}
                                    </h3>
                                    <p className="mb-8 mt-4 text-base text-muted-foreground leading-relaxed">
                                        {filter === "all"
                                            ? "You haven't created any projects yet. Projects are where you collaborate with your team and manage tasks."
                                            : filter === "owned"
                                                ? "You haven't created any projects. Create your first project to take the lead."
                                                : "You haven't joined any projects yet. When you're invited to a project, it will appear here."}
                                    </p>
                                    {filter !== "joined" && (
                                        <div className="transform hover:scale-105 transition-transform duration-200">
                                            <CreateProjectDialog />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
