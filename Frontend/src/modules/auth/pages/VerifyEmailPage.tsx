import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VerifyEmailPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
	const [message, setMessage] = useState("");

	useEffect(() => {
		const token = searchParams.get("token");

		if (!token) {
			setStatus("error");
			setMessage("Invalid verification link");
			return;
		}

		api.get(`/auth/verify-email?token=${token}`)
			.then(() => {
				setStatus("success");
				setMessage("Email verified successfully!");
				setTimeout(() => navigate("/"), 3000);
			})
			.catch((err) => {
				setStatus("error");
				setMessage(err.response?.data?.error || "Verification failed");
			});
	}, [searchParams, navigate]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center space-y-4">
				{status === "loading" && (
					<>
						<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
						<p>Verifying your email...</p>
					</>
				)}
				{status === "success" && (
					<>
						<CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
						<p className="text-lg font-medium">{message}</p>
						<p className="text-muted-foreground">Redirecting to dashboard...</p>
					</>
				)}
				{status === "error" && (
					<>
						<XCircle className="h-12 w-12 text-red-500 mx-auto" />
						<p className="text-lg font-medium">{message}</p>
						<Button asChild>
							<Link to="/auth/login">Go to Login</Link>
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
