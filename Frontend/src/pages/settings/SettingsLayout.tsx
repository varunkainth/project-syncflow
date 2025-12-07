import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { User, Lock } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

// Mobile Navigation Dropdown
function MobileNav({ items }: { items: NavItem[] }) {
    const navigate = useNavigate();
    const location = useLocation();

    const getCurrentValue = () => {
        return items.find(item => location.pathname === item.href)?.href || items[0].href;
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

const sidebarNavItems: NavItem[] = [
    {
        title: "Profile",
        href: "/profile",
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
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-10 pb-16">
            <div className="space-y-0.5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            <div className="border-t" />

            {/* Mobile Navigation */}
            <div className="lg:hidden">
                <MobileNav items={sidebarNavItems} />
            </div>

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block lg:w-1/5">
                    <SidebarNav items={sidebarNavItems} />
                </aside>
                <div className="flex-1 lg:max-w-2xl">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

