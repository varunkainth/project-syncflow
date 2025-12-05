import axios from "axios";


export const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
	withCredentials: true, // For cookies
});

// Request interceptor not needed for cookies (browser handles it)

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// Call refresh endpoint (cookies are sent automatically)
				await axios.post(
					`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/refresh`,
					{},
					{ withCredentials: true }
				);

				// Retry original request
				return api(originalRequest);
			} catch (refreshError) {
				// Refresh failed
				window.location.href = "/auth/login";
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	},
);
