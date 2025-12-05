import { UserPlus, CheckSquare, Edit, MessageSquare, Folder, Bell } from "lucide-react";

interface NotificationIconProps {
    type: string;
}

export function NotificationIcon({ type }: NotificationIconProps) {
    const iconClasses = "h-5 w-5";

    switch (type) {
        case "invite":
            return (
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-950/30">
                    <UserPlus className={`${iconClasses} text-blue-600 dark:text-blue-400`} />
                </div>
            );
        case "task_assigned":
            return (
                <div className="p-2 rounded-md bg-green-100 dark:bg-green-950/30">
                    <CheckSquare className={`${iconClasses} text-green-600 dark:text-green-400`} />
                </div>
            );
        case "task_updated":
            return (
                <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-950/30">
                    <Edit className={`${iconClasses} text-yellow-600 dark:text-yellow-400`} />
                </div>
            );
        case "comment":
            return (
                <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-950/30">
                    <MessageSquare className={`${iconClasses} text-purple-600 dark:text-purple-400`} />
                </div>
            );
        case "project_update":
            return (
                <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-950/30">
                    <Folder className={`${iconClasses} text-orange-600 dark:text-orange-400`} />
                </div>
            );
        default:
            return (
                <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-950/30">
                    <Bell className={`${iconClasses} text-gray-600 dark:text-gray-400`} />
                </div>
            );
    }
}
