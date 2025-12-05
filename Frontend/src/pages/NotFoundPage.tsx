import { Link } from "react-router-dom";
import { Ghost, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
            <div className="flex flex-col items-center space-y-4 text-center">
                <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-primary/20 blur-3xl" />
                    <Ghost className="relative h-32 w-32 text-primary animate-bounce" />
                </div>
                <h1 className="text-9xl font-bold tracking-tighter text-primary/50">404</h1>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Page not found</h2>
                    <p className="text-muted-foreground max-w-[500px]">
                        Whoops! It seems like you've ventured into the void. The page you're looking for doesn't exist or has been moved to another dimension.
                    </p>
                </div>
                <div className="flex gap-4 pt-4">
                    <Button asChild size="lg" className="gap-2">
                        <Link to="/">
                            <Home className="h-4 w-4" />
                            Return Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
