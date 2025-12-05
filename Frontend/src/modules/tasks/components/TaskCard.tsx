import { Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { Task } from "../schema";

interface TaskCardProps {
    task: Task;
    onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string, label: string }> = {
        todo: { variant: "secondary", label: "To Do" },
        "in-progress": { variant: "default", label: "In Progress" },
        done: { variant: "outline", className: "text-green-600 border-green-600", label: "Done" },
    };

    const config = statusConfig[task.status] || { variant: "outline", label: task.status };

    return (
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors group" onClick={onClick}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pr-2">
                <CardTitle className="text-sm font-medium leading-none group-hover:underline decoration-2 underline-offset-4">
                    {task.title}
                </CardTitle>
                <Badge variant={config.variant} className={`${config.className} `}>
                    {config.label}
                </Badge>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {task.description || "No description"}
                </p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
                </div>
                {task.assignee && (
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatarUrl} />
                        <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
            </CardFooter>
        </Card>
    );
}
