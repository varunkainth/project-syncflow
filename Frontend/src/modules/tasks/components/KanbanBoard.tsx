import { useMemo, useState } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTaskCard } from "./KanbanTaskCard";
import type { Task } from "../schema";
import { useUpdateTask } from "../hooks/useTasks";
import { getApiError } from "@/utils/errorHandler";
import { toast } from "sonner";

interface KanbanBoardProps {
    tasks: Task[];
    projectId: string;
    onTaskClick: (taskId: string) => void;
}

const COLUMNS = [
    { id: "todo", title: "To Do", color: "bg-slate-500" },
    { id: "in-progress", title: "In Progress", color: "bg-blue-500" },
    { id: "done", title: "Done", color: "bg-green-500" },
] as const;

type ColumnId = (typeof COLUMNS)[number]["id"];

export function KanbanBoard({ tasks, projectId, onTaskClick }: KanbanBoardProps) {
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const updateTaskMutation = useUpdateTask(projectId);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );

    // Group tasks by status
    const tasksByColumn = useMemo(() => {
        const grouped: Record<ColumnId, Task[]> = {
            "todo": [],
            "in-progress": [],
            "done": [],
        };

        for (const task of tasks) {
            const status = task.status as ColumnId;
            if (grouped[status]) {
                grouped[status].push(task);
            } else {
                // Default to todo if unknown status
                grouped["todo"].push(task);
            }
        }

        return grouped;
    }, [tasks]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = tasks.find((t) => t.id === active.id);
        if (task) {
            setActiveTask(task);
        }
    };

    const handleDragOver = () => {
        // Optional: Add visual feedback when dragging over columns
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        // Check if dropped on a column or another task
        let newStatus: ColumnId | null = null;

        // Check if overId is a column
        if (COLUMNS.some((col) => col.id === overId)) {
            newStatus = overId as ColumnId;
        } else {
            // Dropped on a task, get the column of that task
            const targetTask = tasks.find((t) => t.id === overId);
            if (targetTask) {
                newStatus = targetTask.status as ColumnId;
            }
        }

        if (!newStatus) return;

        // Find the task being moved
        const movedTask = tasks.find((t) => t.id === taskId);
        if (!movedTask || movedTask.status === newStatus) return;

        // Update task status
        try {
            await updateTaskMutation.mutateAsync({
                id: taskId,
                data: { status: newStatus },
            });
            toast.success(`Task moved to ${COLUMNS.find((c) => c.id === newStatus)?.title}`);
        } catch (error) {
            toast.error(getApiError(error, "move task"));
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-3 md:gap-4 h-full min-h-[400px] md:min-h-[500px] overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
                {COLUMNS.map((column) => (
                    <SortableContext
                        key={column.id}
                        items={tasksByColumn[column.id].map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <KanbanColumn
                            id={column.id}
                            title={column.title}
                            color={column.color}
                            taskCount={tasksByColumn[column.id].length}
                        >
                            {tasksByColumn[column.id].map((task) => (
                                <KanbanTaskCard
                                    key={task.id}
                                    task={task}
                                    onClick={() => onTaskClick(task.id)}
                                />
                            ))}
                        </KanbanColumn>
                    </SortableContext>
                ))}
            </div>
            <DragOverlay>
                {activeTask ? (
                    <KanbanTaskCard task={activeTask} isDragging />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
