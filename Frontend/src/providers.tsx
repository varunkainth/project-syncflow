import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ThemeProvider } from "./components/theme-provider";

import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
		},
	},
});

export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				{children}
				<Toaster />
			</ThemeProvider>
		</QueryClientProvider>
	);
}
