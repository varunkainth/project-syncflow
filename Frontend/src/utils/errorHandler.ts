import type { AxiosError } from "axios";

/**
 * Extracts a user-friendly error message from an API error response.
 * 
 * This function handles various error response formats and provides
 * meaningful error messages based on HTTP status codes and response data.
 */
export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
    if (!error) return fallback;

    // Handle Axios errors
    if (isAxiosError(error)) {
        const response = error.response;

        if (!response) {
            // Network error
            return "Unable to connect to the server. Please check your internet connection.";
        }

        const status = response.status;
        const data = response.data as Record<string, any>;

        // Try to extract error message from response body
        let message = data?.error || data?.message || data?.errors?.[0]?.message;

        // If we have a specific error message, use it
        if (message && typeof message === "string") {
            return formatErrorMessage(message, status);
        }

        // Otherwise, provide status-based messages
        return getStatusMessage(status, fallback);
    }

    // Handle Error instances
    if (error instanceof Error) {
        return error.message || fallback;
    }

    // Handle string errors
    if (typeof error === "string") {
        return error;
    }

    return fallback;
}

/**
 * Format the error message based on the status code
 */
function formatErrorMessage(message: string, status: number): string {
    // Enhance certain messages with more context
    const lowerMessage = message.toLowerCase();

    if (status === 401) {
        if (lowerMessage.includes("unauthorized")) {
            return "You need to be logged in to perform this action.";
        }
        return message;
    }

    if (status === 403) {
        if (lowerMessage.includes("permission") || lowerMessage.includes("forbidden")) {
            return "You don't have permission to perform this action.";
        }
        if (lowerMessage.includes("role")) {
            return `Access denied: ${message}`;
        }
        return "You don't have permission to access this resource.";
    }

    if (status === 404) {
        return message.includes("not found") ? message : `Not found: ${message}`;
    }

    if (status === 409) {
        return message.includes("already") ? message : `Conflict: ${message}`;
    }

    if (status === 422 || status === 400) {
        // Validation errors - return as-is
        return message;
    }

    if (status >= 500) {
        return "A server error occurred. Please try again later.";
    }

    return message;
}

/**
 * Get a default message based on HTTP status code
 */
function getStatusMessage(status: number, fallback: string): string {
    switch (status) {
        case 400:
            return "Invalid request. Please check your input.";
        case 401:
            return "You need to be logged in to perform this action.";
        case 403:
            return "You don't have permission to perform this action.";
        case 404:
            return "The requested resource was not found.";
        case 409:
            return "A conflict occurred. The resource may already exist.";
        case 422:
            return "The provided data is invalid.";
        case 429:
            return "Too many requests. Please wait a moment and try again.";
        case 500:
            return "A server error occurred. Please try again later.";
        case 502:
        case 503:
        case 504:
            return "The server is temporarily unavailable. Please try again later.";
        default:
            return fallback;
    }
}

/**
 * Type guard for Axios errors
 */
function isAxiosError(error: unknown): error is AxiosError {
    return (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError === true
    );
}

/**
 * Shorthand for getting error message with a specific fallback
 */
export function getApiError(error: unknown, action: string): string {
    return getErrorMessage(error, `Failed to ${action}`);
}
