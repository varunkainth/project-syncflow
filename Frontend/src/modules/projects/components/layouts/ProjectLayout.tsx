import { Outlet, NavLink, useParams, Link } from "react-router-dom";
import {
    LayoutDashboard,
    CheckSquare,
    MessageSquare,
    Users,
    Settings,
    ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useProject } from "../../hooks/useProjects";

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
                    end={item.href === "."}
                    className={({ isActive }) =>
                        cn(
                            "justify-start text-sm font-medium transition-colors hover:text-primary flex items-center py-2 px-4 rounded-md",
                            isActive
                                ? "bg-muted hover:bg-muted"
                                : "hover:bg-transparent hover:underline",
                            "justify-start"
                        )
                    }
                >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                </NavLink>
            ))}
        </nav>
    );
}

export function ProjectLayout() {
    const { id } = useParams<{ id: string }>();
    const { data: project, isLoading } = useProject(id || "");

    const sidebarNavItems = [
        {
            title: "Overview",
            href: ".",
            icon: LayoutDashboard,
        },
        {
            title: "Tasks",
            href: "tasks",
            icon: CheckSquare,
        },
        {
            title: "Chat",
            href: "chat",
            icon: MessageSquare,
        },
        {
            title: "Team",
            href: "team",
            icon: Users,
        },
        {
            title: "Settings",
            href: "settings",
            icon: Settings,
        },
    ];

    if (isLoading) {
        return <div className="p-8">Loading project...</div>;
    }

    if (!project) {
        return <div className="p-8">Project not found</div>;
    }

    return (
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 p-8">
            <aside className="-mx-4 lg:w-1/5">
                <div className="mb-4 px-4">
                    <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
                        <Link to="/projects">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Projects
                        </Link>
                    </Button>
                    <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
                    <p className="text-muted-foreground text-sm truncate">
                        {project.description}
                    </p>
                </div>
                <SidebarNav items={sidebarNavItems} />
            </aside>
            <div className="flex-1 lg:max-w-4xl">
                <Outlet context={{ project }} />
            </div>
        </div>
    );
}
