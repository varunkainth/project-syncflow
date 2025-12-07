import { useState, useMemo } from "react";
import { formatDistanceToNow, isPast, isWithinInterval, addDays } from "date-fns";
import { CheckCircle2, Clock, AlertCircle, Calendar, FolderKanban } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { useMyTasks } from "../hooks/useTasks";
import { TaskDetailsSheet } from "../components/TaskDetailsSheet";
import type { Task } from "../schema";

const statusConfig = {
    todo: { label: "To Do", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    "in-progress": { label: "In Progress", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    done: { label: "Done", color: "bg-green-500/10 text-green-600 border-green-500/20" },
};

function TaskCard({ task, onTaskClick }: { task: Task; onTaskClick: (task: Task) => void }) {
    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";
    const isDueSoon = task.dueDate && isWithinInterval(new Date(task.dueDate), {
        start: new Date(),
        end: addDays(new Date(), 7),
    }) && task.status !== "done";

    return (
        <Card
            className="hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onTaskClick(task)}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{task.title}</h4>
                            {isOverdue && (
                                <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            )}
                            {isDueSoon && !isOverdue && (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-500/30">Due Soon</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {task.project && (
                                <span className="flex items-center gap-1">
                                    <FolderKanban className="h-3 w-3" />
                                    {task.project.name}
                                </span>
                            )}
                            {task.dueDate && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                                </span>
                            )}
                        </div>
                    </div>
                    <Badge className={statusConfig[task.status]?.color || ""}>
                        {statusConfig[task.status]?.label || task.status}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

function TaskSection({ title, icon: Icon, tasks, emptyMessage, onTaskClick }: {
    title: string;
    icon: React.ElementType;
    tasks: Task[];
    emptyMessage: string;
    onTaskClick: (task: Task) => void;
}) {
    if (tasks.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Icon className="h-5 w-5" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5" />
                    {title}
                    <Badge variant="secondary" className="ml-2">{tasks.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
                ))}
            </CardContent>
        </Card>
    );
}

export function TasksPage() {
    const { data: tasks = [], isLoading } = useMyTasks();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
    };

    const { overdue, dueSoon, inProgress, todo, completed } = useMemo(() => {
        const now = new Date();
        const weekFromNow = addDays(now, 7);

        const overdue: Task[] = [];
        const dueSoon: Task[] = [];
        const inProgress: Task[] = [];
        const todo: Task[] = [];
        const completed: Task[] = [];

        tasks.forEach((task) => {
            if (task.status === "done") {
                completed.push(task);
            } else if (task.status === "in-progress") {
                inProgress.push(task);
            } else if (task.dueDate && isPast(new Date(task.dueDate))) {
                overdue.push(task);
            } else if (task.dueDate && isWithinInterval(new Date(task.dueDate), { start: now, end: weekFromNow })) {
                dueSoon.push(task);
            } else {
                todo.push(task);
            }
        });

        return { overdue, dueSoon, inProgress, todo, completed: completed.slice(0, 10) };
    }, [tasks]);

    if (isLoading) {
        return (
            <div className="container py-6 space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-72" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="pb-3">
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="p-4 rounded-md border">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-5 w-3/4" />
                                                <Skeleton className="h-4 w-1/2" />
                                            </div>
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
                <p className="text-muted-foreground">
                    Tasks assigned to you across all projects
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    {overdue.length > 0 && (
                        <TaskSection
                            title="Overdue"
                            icon={AlertCircle}
                            tasks={overdue}
                            emptyMessage="No overdue tasks"
                            onTaskClick={handleTaskClick}
                        />
                    )}
                    <TaskSection
                        title="Due Soon"
                        icon={Clock}
                        tasks={dueSoon}
                        emptyMessage="No tasks due in the next 7 days"
                        onTaskClick={handleTaskClick}
                    />
                    <TaskSection
                        title="To Do"
                        icon={Calendar}
                        tasks={todo}
                        emptyMessage="No pending tasks"
                        onTaskClick={handleTaskClick}
                    />
                </div>
                <div className="space-y-6">
                    <TaskSection
                        title="In Progress"
                        icon={Clock}
                        tasks={inProgress}
                        emptyMessage="No tasks in progress"
                        onTaskClick={handleTaskClick}
                    />
                    <TaskSection
                        title="Recently Completed"
                        icon={CheckCircle2}
                        tasks={completed}
                        emptyMessage="No completed tasks yet"
                        onTaskClick={handleTaskClick}
                    />
                </div>
            </div>

            {/* Task Details Sheet */}
            {selectedTask && (
                <TaskDetailsSheet
                    taskId={selectedTask.id}
                    projectId={selectedTask.projectId}
                    onClose={() => setSelectedTask(null)}
                />
            )}
        </div>
    );
}
