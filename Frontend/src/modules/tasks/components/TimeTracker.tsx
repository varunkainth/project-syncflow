import { useState, useEffect } from "react";
import { Play, Square, Clock, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    useTaskTimeEntries,
    useRunningTimer,
    useStartTimer,
    useStopTimer,
    useAddManualTimeEntry,
    useDeleteTimeEntry,
    formatDuration,
    type TimeEntry,
} from "../hooks/useTimeTracking";
import { getApiError } from "@/utils/errorHandler";

interface TimeTrackerProps {
    taskId: string;
}

export function TimeTracker({ taskId }: TimeTrackerProps) {
    const [elapsed, setElapsed] = useState(0);
    const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
    const [manualHours, setManualHours] = useState("0");
    const [manualMinutes, setManualMinutes] = useState("30");
    const [manualDescription, setManualDescription] = useState("");

    const { data: runningTimer } = useRunningTimer();
    const { data: timeData, isLoading } = useTaskTimeEntries(taskId);
    const startTimerMutation = useStartTimer(taskId);
    const stopTimerMutation = useStopTimer();
    const addManualMutation = useAddManualTimeEntry(taskId);
    const deleteEntryMutation = useDeleteTimeEntry(taskId);

    const isRunningForThisTask = runningTimer?.taskId === taskId;

    // Update elapsed time every second when timer is running
    useEffect(() => {
        if (isRunningForThisTask && runningTimer) {
            const startTime = new Date(runningTimer.startTime).getTime();
            const updateElapsed = () => {
                const now = Date.now();
                setElapsed(Math.floor((now - startTime) / 1000));
            };
            updateElapsed();
            const interval = setInterval(updateElapsed, 1000);
            return () => clearInterval(interval);
        } else {
            setElapsed(0);
        }
    }, [isRunningForThisTask, runningTimer]);

    const handleStartTimer = async () => {
        try {
            await startTimerMutation.mutateAsync(undefined);
            toast.success("Timer started");
        } catch (error) {
            toast.error(getApiError(error, "start timer"));
        }
    };

    const handleStopTimer = async () => {
        if (!runningTimer) return;
        try {
            await stopTimerMutation.mutateAsync(runningTimer.id);
            toast.success("Timer stopped");
        } catch (error) {
            toast.error(getApiError(error, "stop timer"));
        }
    };

    const handleAddManualEntry = async () => {
        const hours = parseInt(manualHours) || 0;
        const minutes = parseInt(manualMinutes) || 0;
        const totalMinutes = hours * 60 + minutes;

        if (totalMinutes <= 0) {
            toast.error("Please enter a valid duration");
            return;
        }

        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - totalMinutes * 60 * 1000);

        try {
            await addManualMutation.mutateAsync({
                startTime,
                endTime,
                description: manualDescription || undefined,
            });
            toast.success("Time entry added");
            setIsManualDialogOpen(false);
            setManualHours("0");
            setManualMinutes("30");
            setManualDescription("");
        } catch (error) {
            toast.error(getApiError(error, "add time entry"));
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        try {
            await deleteEntryMutation.mutateAsync(entryId);
            toast.success("Entry deleted");
        } catch (error) {
            toast.error(getApiError(error, "delete time entry"));
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Tracking
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Timer Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                        {isRunningForThisTask ? (
                            <Button
                                size="icon"
                                variant="destructive"
                                className="h-9 w-9 sm:h-10 sm:w-10"
                                onClick={handleStopTimer}
                                disabled={stopTimerMutation.isPending}
                            >
                                <Square className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                size="icon"
                                variant="default"
                                className="h-9 w-9 sm:h-10 sm:w-10"
                                onClick={handleStartTimer}
                                disabled={startTimerMutation.isPending || !!runningTimer}
                            >
                                <Play className="h-4 w-4" />
                            </Button>
                        )}
                        <div>
                            <p className="text-sm font-medium">
                                {isRunningForThisTask ? "Timer Running" : "Start Timer"}
                            </p>
                            {runningTimer && !isRunningForThisTask && (
                                <p className="text-xs text-muted-foreground">
                                    Timer running on another task
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={`text-lg sm:text-xl font-mono ${isRunningForThisTask ? "text-green-500" : ""}`}>
                        {formatDuration(isRunningForThisTask ? elapsed : 0)}
                    </div>
                </div>

                {/* Total Time */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total time logged:</span>
                    <span className="font-medium">
                        {isLoading ? <Skeleton className="h-5 w-16" /> : formatDuration(timeData?.totalTime || 0)}
                    </span>
                </div>

                {/* Add Manual Entry */}
                <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Manual Entry
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Manual Time Entry</DialogTitle>
                            <DialogDescription>
                                Manually log time spent on this task.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                    <Label>Hours</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={manualHours}
                                        onChange={(e) => setManualHours(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label>Minutes</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={manualMinutes}
                                        onChange={(e) => setManualMinutes(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description (optional)</Label>
                                <Input
                                    placeholder="What did you work on?"
                                    value={manualDescription}
                                    onChange={(e) => setManualDescription(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsManualDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddManualEntry} disabled={addManualMutation.isPending}>
                                Add Entry
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Time Entries List */}
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12" />
                        <Skeleton className="h-12" />
                    </div>
                ) : timeData?.entries && timeData.entries.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {timeData.entries.map((entry: TimeEntry) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between p-2 rounded border text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    {entry.user && (
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={entry.user.avatarUrl} />
                                            <AvatarFallback className="text-xs">
                                                {entry.user.name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div>
                                        <p className="font-medium">
                                            {formatDuration(entry.duration || 0)}
                                            {entry.isManual && (
                                                <span className="text-xs text-muted-foreground ml-1">(manual)</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(entry.startTime), "MMM d, h:mm a")}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => handleDeleteEntry(entry.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">
                        No time logged yet
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
