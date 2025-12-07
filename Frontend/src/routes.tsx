import { createBrowserRouter } from "react-router-dom";
import { AuthGuard } from "./components/auth-guard";
import { AuthLayout } from "./components/layouts/AuthLayout";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProjectsPage } from "./modules/projects/pages/ProjectsPage";
import { ProjectLayout } from "./modules/projects/components/layouts/ProjectLayout";
import { ProjectOverviewPage } from "./modules/projects/pages/ProjectOverviewPage";
import { ProjectTasksPage } from "./modules/projects/pages/ProjectTasksPage";
import { ProjectChatPage } from "./modules/projects/pages/ProjectChatPage";
import { ProjectTeamPage } from "./modules/projects/pages/ProjectTeamPage";
import { ProjectSettingsPage } from "./modules/projects/pages/ProjectSettingsPage";
import { JoinProjectPage } from "./modules/projects/pages/JoinProjectPage";
import { InvitationDetailsPage } from "./modules/projects/pages/InvitationDetailsPage";
import { TasksPage } from "./modules/tasks/pages/TasksPage";
import { LoginPage } from "./modules/auth/pages/LoginPage";
import { SignupPage } from "./modules/auth/pages/SignupPage";
import { ForgotPasswordPage } from "./modules/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./modules/auth/pages/ResetPasswordPage";
import { OAuthCallbackPage } from "./modules/auth/pages/OAuthCallbackPage";
import { NotificationsPage } from "./modules/notifications/pages/NotificationsPage";
import { CalendarPage } from "./modules/calendar/pages/CalendarPage";
import { SettingsLayout } from "./pages/settings/SettingsLayout";
import { SecurityPage } from "./pages/settings/SecurityPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
	{
		path: "/",
		element: (
			<AuthGuard>
				<DashboardLayout />
			</AuthGuard>
		),
		children: [
			{
				index: true,
				element: <DashboardPage />,
			},
			{
				path: "profile",
				element: <ProfilePage />,
			},
			{
				path: "projects",
				element: <ProjectsPage />,
			},
			{
				path: "tasks",
				element: <TasksPage />,
			},
			{
				path: "calendar",
				element: <CalendarPage />,
			},
			{
				path: "settings",
				element: <SettingsLayout />,
				children: [
					{
						path: "security",
						element: <SecurityPage />,
					},
				],
			},
			{
				path: "projects/:id",
				element: <ProjectLayout />,
				children: [
					{
						index: true,
						element: <ProjectOverviewPage />,
					},
					{
						path: "tasks",
						element: <ProjectTasksPage />,
					},
					{
						path: "chat",
						element: <ProjectChatPage />,
					},
					{
						path: "team",
						element: <ProjectTeamPage />,
					},
					{
						path: "settings",
						element: <ProjectSettingsPage />,
					},
				],
			},
			{
				path: "projects/join/:token",
				element: <JoinProjectPage />,
			},
			{
				path: "invitations/:projectId",
				element: <InvitationDetailsPage />,
			},
			{
				path: "notifications",
				element: <NotificationsPage />,
			},
		],
	},
	{
		path: "/auth",
		element: <AuthLayout />,
		children: [
			{
				path: "login",
				element: <LoginPage />,
			},
			{
				path: "signup",
				element: <SignupPage />,
			},
			{
				path: "forgot-password",
				element: <ForgotPasswordPage />,
			},
			{
				path: "reset-password",
				element: <ResetPasswordPage />,
			},
			{
				path: "oauth-callback",
				element: <OAuthCallbackPage />,
			},
		],
	},
	{
		path: "*",
		element: <NotFoundPage />,
	},
]);
