import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Loader2, Filter, X, User, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import { CreateTaskDialog } from "../../tasks/components/CreateTaskDialog";
import { TaskCard } from "../../tasks/components/TaskCard";
import { TaskDetailsSheet } from "../../tasks/components/TaskDetailsSheet";
import { useTasks, type TaskFilters } from "../../tasks/hooks/useTasks";
import { useProjectMembers } from "../hooks/useProjects";
import type { Project } from "../schema";

type StatusFilter = "all" | "todo" | "in-progress" | "done";

interface Filters {
    status: StatusFilter;
    assigneeId: string;
    creatorId: string;
}

const initialFilters: Filters = {
    status: "all",
    assigneeId: "all",
    creatorId: "all",
};

const ITEMS_PER_PAGE = 12;

export function ProjectTasksPage() {
    const { project } = useOutletContext<{ project: Project }>();
    const { data: members = [] } = useProjectMembers(project.id);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [page, setPage] = useState(1);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Build query filters for server
    const queryFilters: TaskFilters = {
        page,
        limit: ITEMS_PER_PAGE,
        status: filters.status !== "all" ? filters.status : undefined,
        assigneeId: filters.assigneeId !== "all" ? filters.assigneeId : undefined,
        creatorId: filters.creatorId !== "all" ? filters.creatorId : undefined,
    };

    const { data, isLoading, error } = useTasks(project.id, queryFilters);

    // Get unique creators from active members (since tasks include creators)
    const activeMembers = members.filter(m => m.status === 'active');

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.status !== "all") count++;
        if (filters.assigneeId !== "all") count++;
        if (filters.creatorId !== "all") count++;
        return count;
    }, [filters]);

    const clearFilters = () => {
        setFilters(initialFilters);
        setPage(1);
    };

    const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset to page 1 when filter changes
    };

    const handlePrevPage = () => {
        if (data?.pagination.hasPrev) {
            setPage(p => p - 1);
        }
    };

    const handleNextPage = () => {
        if (data?.pagination.hasNext) {
            setPage(p => p + 1);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[200px] items-center justify-center text-destructive">
                Failed to load tasks
            </div>
        );
    }

    const tasks = data?.tasks || [];
    const pagination = data?.pagination;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Tasks</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your project tasks.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Filter Button */}
                    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2">
                                <Filter className="h-4 w-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge className="h-5 w-5 rounded-full p-0 text-xs">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Filters</h4>
                                    {activeFilterCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-xs"
                                            onClick={clearFilters}
                                        >
                                            Clear all
                                        </Button>
                                    )}
                                </div>
                                <Separator />

                                {/* Status Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                        Status
                                    </label>
                                    <Select
                                        value={filters.status}
                                        onValueChange={(v) => updateFilter("status", v as StatusFilter)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="todo">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-slate-500" />
                                                    To Do
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="in-progress">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                    In Progress
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="done">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                    Done
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Assignee Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        Assignee
                                    </label>
                                    <Select
                                        value={filters.assigneeId}
                                        onValueChange={(v) => updateFilter("assigneeId", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Assignees</SelectItem>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {activeMembers.map((member) => (
                                                <SelectItem key={member.userId} value={member.userId}>
                                                    {member.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Creator Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        Created By
                                    </label>
                                    <Select
                                        value={filters.creatorId}
                                        onValueChange={(v) => updateFilter("creatorId", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Creators</SelectItem>
                                            {activeMembers.map((member) => (
                                                <SelectItem key={member.userId} value={member.userId}>
                                                    {member.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <CreateTaskDialog projectId={project.id} />
                </div>
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {filters.status !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                            Status: {filters.status === "todo" ? "To Do" : filters.status === "in-progress" ? "In Progress" : "Done"}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => updateFilter("status", "all")}
                            />
                        </Badge>
                    )}
                    {filters.assigneeId !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                            Assignee: {filters.assigneeId === "unassigned" ? "Unassigned" : activeMembers.find(m => m.userId === filters.assigneeId)?.name || "Unknown"}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => updateFilter("assigneeId", "all")}
                            />
                        </Badge>
                    )}
                    {filters.creatorId !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                            Creator: {activeMembers.find(m => m.userId === filters.creatorId)?.name || "Unknown"}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => updateFilter("creatorId", "all")}
                            />
                        </Badge>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={clearFilters}
                    >
                        Clear all
                    </Button>
                </div>
            )}

            {/* Results count */}
            {pagination && pagination.total > 0 && (
                <p className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
                </p>
            )}

            {tasks && tasks.length > 0 ? (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onClick={() => setSelectedTaskId(task.id)}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination.hasPrev}
                                onClick={handlePrevPage}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination.hasNext}
                                onClick={handleNextPage}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </>
            ) : pagination && pagination.total === 0 && activeFilterCount > 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-md border border-dashed text-center">
                    <Filter className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No tasks match your filters.</p>
                    <Button
                        variant="link"
                        size="sm"
                        onClick={clearFilters}
                    >
                        Clear filters
                    </Button>
                </div>
            ) : (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-md border border-dashed text-center">
                    <p className="text-sm text-muted-foreground">No tasks yet.</p>
                    <p className="text-xs text-muted-foreground">
                        Create a task to get started.
                    </p>
                </div>
            )}

            {/* Task Details Sheet */}
            <TaskDetailsSheet
                taskId={selectedTaskId}
                projectId={project.id}
                onClose={() => setSelectedTaskId(null)}
            />
        </div>
    );
}
