import { useState, useMemo } from "react";
import { FolderKanban, MoreHorizontal, Calendar, Crown, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateProjectDialog } from "../components/CreateProjectDialog";
import { useProjects } from "../hooks/useProjects";
import { useUser } from "../../auth/hooks/useUser";

type FilterType = "all" | "owned" | "joined";

export function ProjectsPage() {
    const { data: projects, isLoading } = useProjects();
    const { data: user } = useUser();
    const [filter, setFilter] = useState<FilterType>("all");

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

    if (isLoading) {
        return <div className="p-8">Loading projects...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">
                        Manage your projects and collaborate with your team.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <CreateProjectDialog />
                </div>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                        All
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                            {counts.all}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="owned" className="flex items-center gap-2">
                        <Crown className="h-3.5 w-3.5" />
                        Owned
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                            {counts.owned}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="joined" className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        Joined
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                            {counts.joined}
                        </Badge>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects?.map((project) => {
                    const isOwner = project.ownerId === user?.id;

                    return (
                        <Card key={project.id} className="flex flex-col">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle>
                                            <Link to={`/projects/${project.id}`} className="hover:underline">
                                                {project.name}
                                            </Link>
                                        </CardTitle>
                                        {/* Ownership Badge */}
                                        {isOwner ? (
                                            <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-0 gap-1">
                                                <Crown className="h-3 w-3" />
                                                Owner
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-0 gap-1">
                                                <Users className="h-3 w-3" />
                                                Member
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription className="line-clamp-2">
                                        {project.description || "No description provided."}
                                    </CardDescription>
                                </div>
                              
                            </CardHeader>
                            <CardContent className="flex-1">
                                {/* Add project stats or progress here later */}
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <FolderKanban className="mr-1 h-4 w-4" />
                                    <span>Active</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="mr-1 h-4 w-4" />
                                    Created {new Date(project.createdAt).toLocaleDateString()}
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
                {filteredProjects?.length === 0 && (
                    <div className="col-span-full flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
                        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                            <FolderKanban className="h-10 w-10 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {filter === "all"
                                    ? "No projects created"
                                    : filter === "owned"
                                        ? "No projects owned"
                                        : "No projects joined"}
                            </h3>
                            <p className="mb-4 mt-2 text-sm text-muted-foreground">
                                {filter === "all"
                                    ? "You haven't created any projects yet. Start by creating a new one."
                                    : filter === "owned"
                                        ? "You haven't created any projects. Create one to become an owner."
                                        : "You haven't joined any projects yet. Ask a team member to invite you."}
                            </p>
                            {filter !== "joined" && <CreateProjectDialog />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
