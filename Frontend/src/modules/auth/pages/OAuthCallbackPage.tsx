import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function OAuthCallbackPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	useEffect(() => {
		const code = searchParams.get("code");
		const error = searchParams.get("error");

		if (error) {
			navigate(`/auth/login?error=${encodeURIComponent(error)}`);
			return;
		}

		if (code) {
			api.post("/auth/oauth/exchange", { code })
				.then(() => {
					queryClient.invalidateQueries({ queryKey: ["user"] });
					navigate("/");
				})
				.catch(() => {
					navigate("/auth/login?error=Failed to complete login");
				});
		} else {
			navigate("/auth/login");
		}
	}, [searchParams, navigate, queryClient]);

	return (
		<div className="flex h-screen items-center justify-center">
			<Loader2 className="h-8 w-8 animate-spin text-primary" />
			<span className="ml-2">Completing login...</span>
		</div>
	);
}
