import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";

interface KanbanColumnProps {
    id: string;
    title: string;
    color: string;
    taskCount: number;
    children: ReactNode;
}

export function KanbanColumn({
    id,
    title,
    color,
    taskCount,
    children,
}: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`
                flex flex-col flex-shrink-0 w-72 sm:w-80 bg-muted/30 rounded-lg snap-center
                transition-colors duration-200
                ${isOver ? "bg-muted/60 ring-2 ring-primary/50" : ""}
            `}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <h3 className="font-semibold text-sm">{title}</h3>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {taskCount}
                </span>
            </div>

            {/* Tasks Container */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px]">
                {children}
                {taskCount === 0 && (
                    <div className="flex items-center justify-center h-20 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                        Drop tasks here
                    </div>
                )}
            </div>
        </div>
    );
}
