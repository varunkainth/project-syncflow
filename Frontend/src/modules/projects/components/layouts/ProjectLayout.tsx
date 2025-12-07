import { Outlet, NavLink, useParams, Link, useNavigate, useLocation } from "react-router-dom";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useProject } from "../../hooks/useProjects";

interface NavItem {
    href: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: NavItem[];
}

function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    return (
        <nav
            className={cn(
                "flex flex-col space-y-1",
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

// Mobile Navigation Dropdown
function MobileNav({ items, currentPath }: { items: NavItem[]; currentPath: string }) {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    // Find current item based on path
    const getCurrentValue = () => {
        const pathEnd = currentPath.split('/').pop();
        if (pathEnd === id) return "."; // Overview page
        return pathEnd || ".";
    };

    const handleNavChange = (value: string) => {
        navigate(value);
    };

    return (
        <Select value={getCurrentValue()} onValueChange={handleNavChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Navigate to..." />
            </SelectTrigger>
            <SelectContent>
                {items.map((item) => (
                    <SelectItem key={item.href} value={item.href}>
                        <div className="flex items-center">
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.title}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function ProjectLayout() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const { data: project, isLoading } = useProject(id || "");

    const sidebarNavItems: NavItem[] = [
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
        return <div className="p-4 sm:p-6 lg:p-8">Loading project...</div>;
    }

    if (!project) {
        return <div className="p-4 sm:p-6 lg:p-8">Project not found</div>;
    }

    return (
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-x-12 lg:space-y-0 p-4 sm:p-6 lg:p-8">
            {/* Mobile/Tablet Header */}
            <div className="lg:hidden space-y-4">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="-ml-2">
                        <Link to="/projects">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">{project.name}</h2>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                        {project.description}
                    </p>
                </div>
                {/* Mobile Navigation Dropdown */}
                <MobileNav items={sidebarNavItems} currentPath={location.pathname} />
            </div>

            {/* Desktop Sidebar - hidden on mobile/tablet */}
            <aside className="hidden lg:block lg:w-1/5">
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

            {/* Main Content */}
            <div className="flex-1 lg:max-w-4xl min-w-0">
                <Outlet context={{ project }} />
            </div>
        </div>
    );
}

