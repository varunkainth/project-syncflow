import { Outlet, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { User, Lock } from "lucide-react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string;
        title: string;
        icon: React.ComponentType<{ className?: string }>;
    }[];
}

function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                        cn(
                            "justify-start flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                            isActive
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground"
                        )
                    }
                >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                </NavLink>
            ))}
        </nav>
    );
}

const sidebarNavItems = [
    {
        title: "Profile",
        href: "/profile", // Keeping profile accessible, though it's a separate route technically
        icon: User,
    },
    {
        title: "Security",
        href: "/settings/security",
        icon: Lock,
    },
];

export function SettingsLayout() {
    return (
        <div className="hidden space-y-6 p-10 pb-16 md:block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            <div className="my-6 border-t" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <SidebarNav items={sidebarNavItems} />
                </aside>
                <div className="flex-1 lg:max-w-2xl">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
