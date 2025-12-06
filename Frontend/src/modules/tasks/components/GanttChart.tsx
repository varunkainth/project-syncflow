import { useMemo, useState } from "react";
import {
    format,
    differenceInDays,
    startOfDay,
    addDays,
    subDays,
    isWithinInterval,
    eachDayOfInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Task } from "../schema";

interface GanttChartProps {
    tasks: Task[];
    onTaskClick: (taskId: string) => void;
}

type ZoomLevel = "day" | "week" | "month";

const ZOOM_CONFIGS = {
    day: { columnWidth: 40, headerFormat: "d", subHeaderFormat: "EEE", daysVisible: 14 },
    week: { columnWidth: 30, headerFormat: "d", subHeaderFormat: "EEE", daysVisible: 28 },
    month: { columnWidth: 20, headerFormat: "d", subHeaderFormat: "", daysVisible: 60 },
};

function getPriorityColor(priority?: string) {
    switch (priority) {
        case "high":
            return "bg-red-500";
        case "medium":
            return "bg-yellow-500";
        case "low":
            return "bg-green-500";
        default:
            return "bg-primary";
    }
}

function getStatusOpacity(status: string) {
    switch (status) {
        case "done":
            return "opacity-60";
        case "in-progress":
            return "";
        default:
            return "opacity-80";
    }
}

export function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
    const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("week");
    const [startDate, setStartDate] = useState(() => startOfDay(subDays(new Date(), 7)));

    const config = ZOOM_CONFIGS[zoomLevel];

    // Calculate the date range for the chart
    const dateRange = useMemo(() => {
        const endDate = addDays(startDate, config.daysVisible);
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [startDate, config.daysVisible]);

    // Filter tasks that have a due date and fall within the visible range
    const visibleTasks = useMemo(() => {
        return tasks.filter((task) => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            const taskStart = task.createdAt ? new Date(task.createdAt) : taskDate;
            const rangeEnd = dateRange[dateRange.length - 1];
            return (
                isWithinInterval(taskDate, { start: startDate, end: rangeEnd }) ||
                isWithinInterval(taskStart, { start: startDate, end: rangeEnd })
            );
        });
    }, [tasks, dateRange, startDate]);

    // Group dates by month for header
    const monthGroups = useMemo(() => {
        const groups: { month: string; days: Date[] }[] = [];
        let currentMonth = "";
        let currentDays: Date[] = [];

        dateRange.forEach((date) => {
            const month = format(date, "MMM yyyy");
            if (month !== currentMonth) {
                if (currentDays.length > 0) {
                    groups.push({ month: currentMonth, days: currentDays });
                }
                currentMonth = month;
                currentDays = [date];
            } else {
                currentDays.push(date);
            }
        });

        if (currentDays.length > 0) {
            groups.push({ month: currentMonth, days: currentDays });
        }

        return groups;
    }, [dateRange]);

    const handlePrev = () => {
        setStartDate((prev) => subDays(prev, Math.floor(config.daysVisible / 2)));
    };

    const handleNext = () => {
        setStartDate((prev) => addDays(prev, Math.floor(config.daysVisible / 2)));
    };

    const handleToday = () => {
        setStartDate(startOfDay(subDays(new Date(), 7)));
    };

    const calculateTaskBar = (task: Task) => {
        const taskEnd = new Date(task.dueDate!);
        const taskStart = task.createdAt ? new Date(task.createdAt) : subDays(taskEnd, 3);

        const chartStart = startDate;
        const chartEnd = dateRange[dateRange.length - 1];

        // Clamp dates to visible range
        const visibleStart = taskStart < chartStart ? chartStart : taskStart;
        const visibleEnd = taskEnd > chartEnd ? chartEnd : taskEnd;

        const startOffset = differenceInDays(visibleStart, chartStart);
        const duration = Math.max(1, differenceInDays(visibleEnd, visibleStart) + 1);

        return {
            left: startOffset * config.columnWidth,
            width: duration * config.columnWidth,
        };
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={handlePrev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={handleToday}>
                        Today
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={handleNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="hidden sm:block text-sm font-medium">
                        {format(startDate, "MMM d")} - {format(dateRange[dateRange.length - 1], "MMM d, yyyy")}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant={zoomLevel === "day" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 sm:h-8 text-xs"
                        onClick={() => setZoomLevel("day")}
                    >
                        Day
                    </Button>
                    <Button
                        variant={zoomLevel === "week" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 sm:h-8 text-xs"
                        onClick={() => setZoomLevel("week")}
                    >
                        Week
                    </Button>
                    <Button
                        variant={zoomLevel === "month" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 sm:h-8 text-xs"
                        onClick={() => setZoomLevel("month")}
                    >
                        Month
                    </Button>
                </div>
            </div>

            {/* Chart Container */}
            <div className="flex overflow-x-auto">
                {/* Task Names Column */}
                <div className="flex-shrink-0 w-32 sm:w-40 md:w-48 border-r bg-muted/20">
                    {/* Header placeholder */}
                    <div className="h-16 border-b px-3 flex items-end pb-2">
                        <span className="text-xs font-medium text-muted-foreground">Tasks</span>
                    </div>
                    {/* Task rows */}
                    {visibleTasks.map((task) => (
                        <div
                            key={task.id}
                            className="h-10 px-3 flex items-center border-b cursor-pointer hover:bg-muted/50"
                            onClick={() => onTaskClick(task.id)}
                        >
                            <span className="text-sm truncate" title={task.title}>
                                {task.title}
                            </span>
                        </div>
                    ))}
                    {visibleTasks.length === 0 && (
                        <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
                            No tasks with due dates
                        </div>
                    )}
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-x-auto">
                    <div style={{ minWidth: dateRange.length * config.columnWidth }}>
                        {/* Month Header */}
                        <div className="h-8 border-b flex">
                            {monthGroups.map((group) => (
                                <div
                                    key={group.month}
                                    className="border-r flex items-center justify-center text-xs font-medium bg-muted/20"
                                    style={{ width: group.days.length * config.columnWidth }}
                                >
                                    {group.month}
                                </div>
                            ))}
                        </div>

                        {/* Day Header */}
                        <div className="h-8 border-b flex">
                            {dateRange.map((date) => {
                                const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                return (
                                    <div
                                        key={date.toISOString()}
                                        className={`
                                            flex flex-col items-center justify-center text-xs border-r
                                            ${isToday ? "bg-primary/20 font-bold" : ""}
                                            ${isWeekend && !isToday ? "bg-muted/40" : ""}
                                        `}
                                        style={{ width: config.columnWidth }}
                                    >
                                        <span>{format(date, config.headerFormat)}</span>
                                        {config.subHeaderFormat && (
                                            <span className="text-[10px] text-muted-foreground">
                                                {format(date, config.subHeaderFormat)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Task Bars */}
                        {visibleTasks.map((task) => {
                            const bar = calculateTaskBar(task);
                            return (
                                <div
                                    key={task.id}
                                    className="h-10 border-b relative flex items-center"
                                >
                                    {/* Grid lines */}
                                    <div className="absolute inset-0 flex">
                                        {dateRange.map((date) => {
                                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                            return (
                                                <div
                                                    key={date.toISOString()}
                                                    className={`border-r ${isWeekend ? "bg-muted/20" : ""}`}
                                                    style={{ width: config.columnWidth }}
                                                />
                                            );
                                        })}
                                    </div>
                                    {/* Task bar */}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`
                                                        absolute h-6 rounded cursor-pointer
                                                        ${getPriorityColor(task.priority)}
                                                        ${getStatusOpacity(task.status)}
                                                        hover:opacity-100 transition-opacity
                                                        flex items-center px-2
                                                    `}
                                                    style={{
                                                        left: bar.left,
                                                        width: bar.width,
                                                    }}
                                                    onClick={() => onTaskClick(task.id)}
                                                >
                                                    <span className="text-xs text-white truncate">
                                                        {bar.width > 60 ? task.title : ""}
                                                    </span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="space-y-1">
                                                    <p className="font-medium">{task.title}</p>
                                                    <p className="text-xs">
                                                        Due: {format(new Date(task.dueDate!), "MMM d, yyyy")}
                                                    </p>
                                                    <p className="text-xs capitalize">
                                                        Status: {task.status} | Priority: {task.priority || "none"}
                                                    </p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
