import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/modules/auth/hooks/useUser";

export function AuthGuard({ children }: { children: React.ReactNode }) {
	const { data: user, isLoading, error } = useUser();
	const navigate = useNavigate();

	useEffect(() => {
		if (!isLoading && !user && error) {
			navigate("/auth/login");
		}

		// console.log(user, isLoading, error);
	}, [user, isLoading, error, navigate]);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (error) {
		return null; // Will redirect via useEffect
	}

	return <>{children}</>;
}
