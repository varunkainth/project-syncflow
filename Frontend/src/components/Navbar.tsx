import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Search,
    User,
    Settings,
    LogOut,
    CreditCard,
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationBell } from "@/modules/notifications/components/NotificationBell";
import { useUser } from "@/modules/auth/hooks/useUser";
import { useLogout } from "@/modules/auth/hooks/useLogout";
import { cn } from "@/lib/utils";

export function Navbar() {
    const [open, setOpen] = useState(false);
    const { data: user } = useUser();
    const { mutate: logout } = useLogout();
    const location = useLocation();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const navItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Projects", href: "/projects", icon: FolderKanban },
        { name: "Tasks", href: "/tasks", icon: CheckSquare },
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-4">
                <div className="mr-8 hidden md:flex">
                    <Link to="/" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-bold sm:inline-block text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            AntiGravity
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "transition-colors hover:text-foreground/80 flex items-center gap-2",
                                    location.pathname === item.href
                                        ? "text-foreground"
                                        : "text-foreground/60",
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        <Button
                            variant="outline"
                            className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 bg-muted/50 hover:bg-muted/80"
                            onClick={() => setOpen(true)}
                        >
                            <Search className="mr-2 h-4 w-4" />
                            <span className="hidden lg:inline-flex">Search...</span>
                            <span className="inline-flex lg:hidden">Search...</span>
                            <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </Button>
                        <CommandDialog open={open} onOpenChange={setOpen}>
                            <CommandInput placeholder="Type a command or search..." />
                            <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup heading="Suggestions">
                                    <CommandItem>Dashboard</CommandItem>
                                    <CommandItem>Settings</CommandItem>
                                    <CommandItem>Profile</CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </CommandDialog>
                    </div>
                    <nav className="flex items-center gap-2">
                        <NotificationBell />
                        <ModeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-8 w-8 rounded-full ring-2 ring-primary/10 hover:ring-primary/30 transition-all"
                                >
                                    <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                                        <User className="h-4 w-4" />
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {user?.name || "User"}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email || "user@example.com"}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <Link to="/settings/security">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/profile">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        <span>Billing</span>
                                        <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => logout()}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>
            </div>
        </header>
    );
}
