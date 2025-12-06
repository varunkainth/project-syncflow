import { useState, useEffect } from "react";
import { Link2, Plus, X, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "../hooks/useTasks";
import { api } from "@/lib/api";
import { encryptPayload, decryptPayload } from "@/utils/encryption";
import { getApiError } from "@/utils/errorHandler";
import type { Task } from "../schema";

interface DependencySelectorProps {
    projectId: string;
    taskId: string; // Current task ID
}

interface Dependency {
    id: string;
    dependsOnTaskId: string;
    type: string;
    dependsOnTask?: Task;
}

export function DependencySelector({
    projectId,
    taskId,
}: DependencySelectorProps) {
    const [open, setOpen] = useState(false);
    const [dependencies, setDependencies] = useState<Dependency[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const { data: tasksData } = useTasks(projectId, { limit: 100 });

    // Fetch current dependencies
    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/dependencies/tasks/${taskId}`);
                const decryptedData = decryptPayload(response.data.data);
                setDependencies(decryptedData.dependencies || []);
            } catch (error) {
                // Dependencies might not exist yet, that's OK
                setDependencies([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDependencies();
    }, [taskId]);

    const selectedDependencyIds = dependencies.map(d => d.dependsOnTaskId);

    // Filter out current task and already selected dependencies
    const availableTasks = (tasksData?.tasks || []).filter(
        (task) =>
            task.id !== taskId && !selectedDependencyIds.includes(task.id)
    );

    const selectedTasks = (tasksData?.tasks || []).filter((task) =>
        selectedDependencyIds.includes(task.id)
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "done":
                return "bg-green-500";
            case "in-progress":
                return "bg-blue-500";
            default:
                return "bg-slate-500";
        }
    };

    const handleAdd = async (dependsOnTaskId: string) => {
        setIsAdding(true);
        try {
            const encryptedData = encryptPayload({
                dependentTaskId: taskId,
                dependsOnTaskId,
                type: "blocks"
            });
            await api.post("/dependencies", { data: encryptedData });

            // Add to local state
            setDependencies(prev => [
                ...prev,
                { id: crypto.randomUUID(), dependsOnTaskId, type: "blocks" }
            ]);
            setOpen(false);
            toast.success("Dependency added");
        } catch (error) {
            toast.error(getApiError(error, "add dependency"));
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemove = async (dependsOnTaskId: string) => {
        try {
            const encryptedData = encryptPayload({
                dependentTaskId: taskId,
                dependsOnTaskId
            });
            await api.delete("/dependencies", { data: { data: encryptedData } });

            // Remove from local state
            setDependencies(prev => prev.filter(d => d.dependsOnTaskId !== dependsOnTaskId));
            toast.success("Dependency removed");
        } catch (error) {
            toast.error(getApiError(error, "remove dependency"));
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Link2 className="h-4 w-4" />
                    Dependencies
                </div>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7" disabled={isAdding}>
                            {isAdding ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                                <Plus className="h-3 w-3 mr-1" />
                            )}
                            Add
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="end">
                        <Command>
                            <CommandInput placeholder="Search tasks..." />
                            <CommandList>
                                <CommandEmpty>No tasks found.</CommandEmpty>
                                <CommandGroup>
                                    {availableTasks.map((task) => (
                                        <CommandItem
                                            key={task.id}
                                            value={task.title}
                                            onSelect={() => handleAdd(task.id)}
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                <div className={`h-2 w-2 rounded-full ${getStatusColor(task.status)}`} />
                                                <span className="flex-1 truncate text-sm">
                                                    {task.title}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Selected Dependencies */}
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-8" />
                    <Skeleton className="h-8" />
                </div>
            ) : selectedTasks.length > 0 ? (
                <div className="space-y-2">
                    {selectedTasks.map((task) => (
                        <div
                            key={task.id}
                            className="flex items-center justify-between p-2 rounded border bg-muted/30"
                        >
                            <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${getStatusColor(task.status)}`} />
                                <span className="text-sm truncate max-w-[180px]">
                                    {task.title}
                                </span>
                                {task.status !== "done" && (
                                    <Badge variant="outline" className="text-xs px-1 py-0 text-yellow-600">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Blocking
                                    </Badge>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemove(task.id)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                    No dependencies added
                </p>
            )}

            {/* Blocking Warning */}
            {selectedTasks.some((task) => task.status !== "done") && (
                <div className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <p className="text-yellow-700 dark:text-yellow-400">
                        This task is blocked by incomplete dependencies
                    </p>
                </div>
            )}
        </div>
    );
}
