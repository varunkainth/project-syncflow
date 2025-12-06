import { useState, useMemo } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
} from "date-fns";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Download,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalendarTasks, useExportICal } from "../hooks/useCalendar";
import type { Task } from "@/modules/tasks/schema";
import { Link } from "react-router-dom";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function getPriorityColor(priority?: string) {
    switch (priority) {
        case "high":
            return "bg-red-500/80";
        case "medium":
            return "bg-yellow-500/80";
        case "low":
            return "bg-green-500/80";
        default:
            return "bg-primary/60";
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case "done":
            return "text-green-500";
        case "in-progress":
            return "text-blue-500";
        default:
            return "text-muted-foreground";
    }
}

interface DayCellProps {
    date: Date;
    currentMonth: Date;
    tasks: Task[];
}

function DayCell({ date, currentMonth, tasks }: DayCellProps) {
    const dayTasks = tasks.filter((task) =>
        task.dueDate ? isSameDay(new Date(task.dueDate), date) : false
    );
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isCurrentDay = isToday(date);

    return (
        <div
            className={`
                min-h-[60px] sm:min-h-[80px] md:min-h-[100px] p-0.5 sm:p-1 border-b border-r transition-colors
                ${!isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "bg-background"}
                ${isCurrentDay ? "bg-primary/10" : ""}
            `}
        >
            <div
                className={`
                    text-right text-xs sm:text-sm font-medium p-0.5 sm:p-1 rounded-full w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center ml-auto
                    ${isCurrentDay ? "bg-primary text-primary-foreground" : ""}
                `}
            >
                {format(date, "d")}
            </div>
            <div className="space-y-0.5 sm:space-y-1 mt-0.5 sm:mt-1 max-h-[50px] sm:max-h-[80px] overflow-y-auto">
                {dayTasks.slice(0, 3).map((task) => (
                    <TooltipProvider key={task.id}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    to={`/projects/${task.projectId}/tasks`}
                                    className={`
                                        block text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer
                                        hover:opacity-80 transition-opacity text-white
                                        ${getPriorityColor(task.priority)}
                                    `}
                                >
                                    <span className="hidden sm:inline">{task.title}</span>
                                    <span className="sm:hidden">·</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                                <div className="space-y-1">
                                    <p className="font-medium">{task.title}</p>
                                    {task.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {task.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={getStatusColor(task.status)}>
                                            {task.status}
                                        </span>
                                        {task.priority && (
                                            <Badge variant="outline" className="text-xs">
                                                {task.priority}
                                            </Badge>
                                        )}
                                    </div>
                                    {task.project && (
                                        <p className="text-xs text-muted-foreground">
                                            Project: {task.project.name}
                                        </p>
                                    )}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
                {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                        +{dayTasks.length - 3} more
                    </div>
                )}
            </div>
        </div>
    );
}

export function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isExporting, setIsExporting] = useState(false);

    // Calculate the date range for the current view (including days from prev/next months)
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    // Fetch tasks for the visible date range
    const { data: tasks = [], isLoading } = useCalendarTasks(calendarStart, calendarEnd);
    const { downloadICal } = useExportICal();

    // Generate calendar grid
    const calendarDays = useMemo(() => {
        const days: Date[] = [];
        let day = calendarStart;
        while (day <= calendarEnd) {
            days.push(day);
            day = addDays(day, 1);
        }
        return days;
    }, [calendarStart, calendarEnd]);

    const handlePreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handleToday = () => {
        setCurrentMonth(new Date());
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await downloadICal();
            toast.success("Calendar exported successfully!");
        } catch (error) {
            toast.error("Failed to export calendar");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                        Calendar
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View your tasks on a calendar
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="sm:size-default"
                    onClick={handleExport}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    <span className="hidden sm:inline">Export to</span> iCal
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-2 px-2 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9"
                                onClick={handlePreviousMonth}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9"
                                onClick={handleNextMonth}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleToday}>
                                Today
                            </Button>
                            <CardTitle className="text-base sm:text-xl">
                                {format(currentMonth, "MMM yyyy")}
                            </CardTitle>
                        </div>
                        <div className="hidden md:flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-red-500/80" />
                                <span>High</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-yellow-500/80" />
                                <span>Medium</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-green-500/80" />
                                <span>Low</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6">
                            <Skeleton className="h-[500px] w-full" />
                        </div>
                    ) : (
                        <div className="border-t border-l">
                            {/* Weekday headers */}
                            <div className="grid grid-cols-7">
                                {WEEKDAYS.map((day, index) => (
                                    <div
                                        key={day}
                                        className="p-1 sm:p-2 text-center text-xs sm:text-sm font-semibold border-b border-r bg-muted/50"
                                    >
                                        <span className="hidden sm:inline">{day}</span>
                                        <span className="sm:hidden">{WEEKDAYS_SHORT[index]}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Calendar grid */}
                            <div className="grid grid-cols-7">
                                {calendarDays.map((day) => (
                                    <DayCell
                                        key={day.toISOString()}
                                        date={day}
                                        currentMonth={currentMonth}
                                        tasks={tasks}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
