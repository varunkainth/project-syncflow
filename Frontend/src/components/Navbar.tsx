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
    Menu,
    Calendar,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationBell } from "@/modules/notifications/components/NotificationBell";
import { useUser } from "@/modules/auth/hooks/useUser";
import { useLogout } from "@/modules/auth/hooks/useLogout";
import { cn } from "@/lib/utils";

export function Navbar() {
    const [open, setOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const navItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Projects", href: "/projects", icon: FolderKanban },
        { name: "Tasks", href: "/tasks", icon: CheckSquare },
        { name: "Calendar", href: "/calendar", icon: Calendar },
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 sm:h-16 items-center px-4">
                {/* Mobile Menu Button */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild className="md:hidden mr-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle className="text-left font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                AntiGravity
                            </SheetTitle>
                        </SheetHeader>
                        <nav className="flex flex-col p-4 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                                        location.pathname === item.href
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            ))}
                            {/* Divider */}
                            <div className="my-2 border-t" />
                            {/* Profile Link */}
                            <Link
                                to="/profile"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                                    location.pathname === "/profile"
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                            >
                                <User className="h-5 w-5" />
                                Profile
                            </Link>
                            {/* Settings Link */}
                            <Link
                                to="/settings/security"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                                    location.pathname.startsWith("/settings")
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                            >
                                <Settings className="h-5 w-5" />
                                Settings
                            </Link>
                        </nav>
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user?.avatarUrl} className="object-cover" />
                                    <AvatarFallback>
                                        {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user?.email || "user@example.com"}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => logout()}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Log out
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Logo - Always visible */}
                <Link to="/" className="flex items-center mr-4 md:mr-8">
                    <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        AntiGravity
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                                location.pathname === item.href
                                    ? "bg-primary/10 text-primary"
                                    : "text-foreground/60 hover:text-foreground hover:bg-muted",
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            <span className="hidden lg:inline">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                {/* Right side items */}
                <div className="flex flex-1 items-center justify-end space-x-2">
                    {/* Search - Hidden on very small screens */}
                    <div className="hidden sm:block">
                        <Button
                            variant="outline"
                            className="relative h-9 w-9 sm:w-auto justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 bg-muted/50 hover:bg-muted/80"
                            onClick={() => setOpen(true)}
                        >
                            <Search className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline-flex">Search...</span>
                            <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </Button>
                    </div>

                    {/* Mobile Search Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="sm:hidden h-9 w-9"
                        onClick={() => setOpen(true)}
                    >
                        <Search className="h-5 w-5" />
                    </Button>

                    <CommandDialog open={open} onOpenChange={setOpen}>
                        <CommandInput placeholder="Type a command or search..." />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup heading="Navigation">
                                {navItems.map((item) => (
                                    <CommandItem
                                        key={item.href}
                                        onSelect={() => {
                                            setOpen(false);
                                            window.location.href = item.href;
                                        }}
                                    >
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandGroup heading="Quick Actions">
                                <CommandItem>Settings</CommandItem>
                                <CommandItem>Profile</CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </CommandDialog>

                    <nav className="flex items-center gap-1 sm:gap-2">
                        <NotificationBell />
                        <ModeToggle />

                        {/* User Menu - Desktop */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-8 w-8 rounded-full ring-2 ring-primary/10 hover:ring-primary/30 transition-all hidden sm:flex p-0"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.avatarUrl} className="object-cover" />
                                        <AvatarFallback className="text-xs">
                                            {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
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
