import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

export function DashboardLayout() {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<Navbar />
			<div className="flex flex-1">
				{/* Sidebar removed as per user request */}


				{/* Main Content */}
				<main className="flex-1 p-6">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
