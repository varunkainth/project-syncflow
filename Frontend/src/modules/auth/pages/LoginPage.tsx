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
		<Card className="w-full max-w-md">
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
												<Input type="password" {...field} />
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
