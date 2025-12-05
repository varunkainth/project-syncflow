import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api } from "@/lib/api";
import { encryptPayload } from "@/utils/encryption";

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(data: ForgotPasswordFormValues) {
        setIsLoading(true);
        try {
            const encryptedData = encryptPayload(data);
            await api.post("/auth/forgot-password", { data: encryptedData });
            setIsSuccess(true);
            toast.success("Reset link sent", {
                description: "Check your email for instructions to reset your password.",
            });
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.error || "Failed to send reset link",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
                <CardDescription>
                    Enter your email address and we'll send you a link to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
                        <div className="rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                            <Mail className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-medium">Check your email</h3>
                        <p className="text-sm text-muted-foreground">
                            We've sent a password reset link to <strong>{form.getValues("email")}</strong>.
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                            <Link to="/auth/login">Back to Login</Link>
                        </Button>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="m@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Reset Link
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
            {!isSuccess && (
                <CardFooter className="flex justify-center">
                    <Button variant="link" className="px-0" asChild>
                        <Link to="/auth/login">Back to Login</Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
