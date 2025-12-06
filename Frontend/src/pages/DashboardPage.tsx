import {
    Activity,
    Users,
    CheckCircle2,
    Calendar,
    FolderKanban,
    Clock,
    AlertCircle,
    ArrowRight,
    Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, format, isPast, isToday, isTomorrow } from "date-fns";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/modules/auth/hooks/useUser";
import { useDashboard } from "@/hooks/useDashboard";
import { CreateProjectDialog } from "@/modules/projects/components/CreateProjectDialog";

// Helper to format action text
function formatAction(action: string): string {
    const actions: Record<string, string> = {
        create_task: "created a task",
        complete_task: "completed a task",
        update_task: "updated a task",
        delete_task: "deleted a task",
        create_project: "created a project",
        update_project: "updated a project",
        add_comment: "commented on a task",
        invite_member: "invited a member",
        join_project: "joined a project",
    };
    return actions[action] || action.replace(/_/g, " ");
}

// Helper to format due date display
function formatDueDate(dueDate: string): string {
    const date = new Date(dueDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, { class: string; label: string }> = {
        todo: { class: "bg-slate-500/20 text-slate-600 dark:text-slate-400", label: "To Do" },
        "in-progress": { class: "bg-blue-500/20 text-blue-600 dark:text-blue-400", label: "In Progress" },
        done: { class: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400", label: "Done" },
    };
    const variant = variants[status] || variants.todo;
    return <Badge className={`${variant.class} border-0`}>{variant.label}</Badge>;
}

export function DashboardPage() {
    const { data: user } = useUser();
    const { data: dashboard, isLoading, error } = useDashboard();

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 text-destructive">
                Failed to load dashboard data
            </div>
        );
    }

    const stats = [
        {
            title: "Total Projects",
            value: dashboard?.stats.totalProjects || 0,
            description: "Projects you're part of",
            icon: FolderKanban,
            color: "text-blue-500",
        },
        {
            title: "Active Tasks",
            value: dashboard?.stats.activeTasks || 0,
            description: "Tasks in progress",
            icon: Activity,
            color: "text-amber-500",
        },
        {
            title: "Completed Tasks",
            value: dashboard?.stats.completedTasks || 0,
            description: "Tasks done",
            icon: CheckCircle2,
            color: "text-emerald-500",
        },
        {
            title: "Team Members",
            value: dashboard?.stats.teamMembers || 0,
            description: "Across all projects",
            icon: Users,
            color: "text-purple-500",
        },
    ];

    return (
        <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Here's what's happening with your projects.
                    </p>
                </div>
                <CreateProjectDialog />
            </div>

            {/* Stats Grid */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Overdue Alert */}
            {dashboard?.stats.overdueTasks && dashboard.stats.overdueTasks > 0 && (
                <Card className="border-red-500/50 bg-red-500/10">
                    <CardContent className="flex items-center gap-4 py-4">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <div className="flex-1">
                            <p className="font-medium text-red-600 dark:text-red-400">
                                You have {dashboard.stats.overdueTasks} overdue task{dashboard.stats.overdueTasks > 1 ? 's' : ''}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Review and update your pending tasks
                            </p>
                        </div>
                        <Link to="/tasks">
                            <Button variant="outline" size="sm" className="border-red-500/50 text-red-600 hover:bg-red-500/10">
                                View Tasks
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Main Content Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-7">
                {/* My Tasks */}
                <Card className="lg:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>My Tasks</CardTitle>
                            <CardDescription>
                                Tasks assigned to you
                            </CardDescription>
                        </div>
                        <Link to="/tasks">
                            <Button variant="ghost" size="sm">
                                View all
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {dashboard?.myTasks && dashboard.myTasks.length > 0 ? (
                            <div className="space-y-4">
                                {dashboard.myTasks.map((task) => (
                                    <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{task.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {task.project?.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {task.dueDate && (
                                                <div className={`flex items-center gap-1 text-xs ${isPast(new Date(task.dueDate)) ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                    <Clock className="h-3 w-3" />
                                                    {formatDueDate(task.dueDate)}
                                                </div>
                                            )}
                                            <StatusBadge status={task.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">No pending tasks</p>
                                <p className="text-xs text-muted-foreground">You're all caught up!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Upcoming
                        </CardTitle>
                        <CardDescription>
                            Tasks due in the next 7 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dashboard?.upcomingTasks && dashboard.upcomingTasks.length > 0 ? (
                            <div className="space-y-4">
                                {dashboard.upcomingTasks.map((task) => (
                                    <div key={task.id} className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                            <Calendar className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-muted-foreground">
                                                    {task.project?.name}
                                                </span>
                                                {task.dueDate && (
                                                    <>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className={`text-xs ${isToday(new Date(task.dueDate)) ? 'text-amber-500 font-medium' : 'text-muted-foreground'}`}>
                                                            {formatDueDate(task.dueDate)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                                <p className="text-xs text-muted-foreground">Your week looks clear</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Your latest actions across projects
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
                        <ScrollArea className="h-[300px] px-6 pb-6">
                            <div className="space-y-6">
                                {dashboard.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-4">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={activity.user.avatarUrl || undefined} />
                                            <AvatarFallback className="text-xs">
                                                {activity.user.name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm">
                                                <span className="font-medium">{activity.user.name}</span>{' '}
                                                <span className="text-muted-foreground">{formatAction(activity.action)}</span>
                                                {activity.metadata && (
                                                    <span className="font-medium">
                                                        {' '}{JSON.parse(activity.metadata)?.title || ''}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center px-6">
                            <Activity className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No recent activity</p>
                            <p className="text-xs text-muted-foreground">Start working on a project to see activity here</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
