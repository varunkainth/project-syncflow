import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { Calendar, User2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Task } from "../schema";

interface KanbanTaskCardProps {
    task: Task;
    onClick?: () => void;
    isDragging?: boolean;
}

function getPriorityStyles(priority?: string) {
    switch (priority) {
        case "high":
            return "border-l-4 border-l-red-500";
        case "medium":
            return "border-l-4 border-l-yellow-500";
        case "low":
            return "border-l-4 border-l-green-500";
        default:
            return "";
    }
}

function getDueDateStatus(dueDate?: string) {
    if (!dueDate) return null;

    const due = new Date(dueDate);
    const now = new Date();

    if (isPast(due) && due.toDateString() !== now.toDateString()) {
        return "overdue";
    }
    if (isWithinInterval(due, { start: now, end: addDays(now, 2) })) {
        return "soon";
    }
    return "normal";
}

export function KanbanTaskCard({ task, onClick, isDragging }: KanbanTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSorting,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const dueDateStatus = getDueDateStatus(task.dueDate);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group bg-card rounded-lg border shadow-sm cursor-pointer 
                hover:shadow-md transition-all
                ${getPriorityStyles(task.priority)}
                ${isSorting || isDragging ? "opacity-50 rotate-3 shadow-lg" : ""}
            `}
            onClick={onClick}
        >
            <div className="p-3 space-y-2">
                {/* Header with drag handle */}
                <div className="flex items-start gap-2">
                    <button
                        {...attributes}
                        {...listeners}
                        className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-muted-foreground hover:text-foreground transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                    <h4 className="flex-1 text-sm font-medium line-clamp-2">
                        {task.title}
                    </h4>
                </div>

                {/* Description preview */}
                {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-1">
                    {/* Due date */}
                    {task.dueDate && (
                        <div
                            className={`
                                flex items-center gap-1 text-xs
                                ${dueDateStatus === "overdue" ? "text-red-500" : ""}
                                ${dueDateStatus === "soon" ? "text-yellow-500" : ""}
                                ${dueDateStatus === "normal" ? "text-muted-foreground" : ""}
                            `}
                        >
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(task.dueDate), "MMM d")}</span>
                        </div>
                    )}

                    {/* Priority badge */}
                    {task.priority && (
                        <Badge
                            variant="outline"
                            className={`
                                text-xs px-1.5 py-0
                                ${task.priority === "high" ? "border-red-500 text-red-500" : ""}
                                ${task.priority === "medium" ? "border-yellow-500 text-yellow-500" : ""}
                                ${task.priority === "low" ? "border-green-500 text-green-500" : ""}
                            `}
                        >
                            {task.priority}
                        </Badge>
                    )}

                    {/* Assignee avatar */}
                    {task.assignee && (
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assignee.avatarUrl} />
                            <AvatarFallback className="text-xs">
                                {task.assignee.name?.charAt(0) || <User2 className="h-3 w-3" />}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </div>
        </div>
    );
}
