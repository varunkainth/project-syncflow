import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { api } from "@/lib/api";
import { type LoginFormValues, loginSchema } from "../schema";
import { encryptPayload, decryptPayload } from "@/utils/encryption";

export function LoginPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [isLoading, setIsLoading] = useState(false);
	const [showTwoFactor, setShowTwoFactor] = useState(false);

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
			code: "",
		},
	});

	async function onSubmit(data: LoginFormValues) {
		const encryptedData = encryptPayload(data);
		setIsLoading(true);
		try {
			const response = await api.post("/auth/login", { data: encryptedData });
			const decryptedData = decryptPayload(response.data.data);

			// Cookies are set by the server
			if (decryptedData.require2fa) {
				setShowTwoFactor(true);
			} else {
				// Check for returnUrl query parameter
				const returnUrl = searchParams.get('returnUrl');
				navigate(returnUrl || "/");
			}
		} catch (error: any) {
			console.error(error);
			// TODO: Handle error properly (toast)
			if (error.response?.data?.message) {
				form.setError("root", { message: error.response.data.message });
			} else {
				form.setError("root", {
					message: "Something went wrong. Please try again.",
				});
			}
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Card className="w-full max-w-md mx-4 sm:mx-0">
			<CardHeader>
				<CardTitle>Login</CardTitle>
				<CardDescription>
					Enter your credentials to access your account
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						{!showTwoFactor ? (
							<>
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
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<div className="flex items-center justify-between">
												<FormLabel>Password</FormLabel>
												<Link
													to="/auth/forgot-password"
													className="text-sm font-medium text-primary underline-offset-4 hover:underline"
												>
													Forgot password?
												</Link>
											</div>
											<FormControl>
												<PasswordInput {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</>
						) : (
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Two-Factor Code</FormLabel>
										<FormControl>
											<Input placeholder="123456" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{form.formState.errors.root && (
							<div className="text-sm font-medium text-destructive">
								{form.formState.errors.root.message}
							</div>
						)}

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{showTwoFactor ? "Verify" : "Sign In"}
						</Button>
					</form>
				</Form>
				<div className="relative my-4">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							Or continue with
						</span>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<Button
						variant="outline"
						type="button"
						onClick={() => {
							window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/google`;
						}}
					>
						<svg
							className="mr-2 h-4 w-4"
							aria-hidden="true"
							focusable="false"
							data-prefix="fab"
							data-icon="google"
							role="img"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
						>
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Google
					</Button>
					<Button
						variant="outline"
						type="button"
						onClick={() => {
							window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/github`;
						}}
					>
						<svg
							className="mr-2 h-4 w-4"
							aria-hidden="true"
							focusable="false"
							data-prefix="fab"
							data-icon="github"
							role="img"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
							/>
						</svg>
						GitHub
					</Button>
				</div>
			</CardContent>
			<CardFooter className="flex justify-center">
				<div className="text-sm text-muted-foreground">
					Don&apos;t have an account?{" "}
					<Link to="/auth/signup" className="underline hover:text-primary">
						Sign up
					</Link>
				</div>
			</CardFooter>
		</Card>
	);
}
