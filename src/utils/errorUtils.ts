/**
 * Error Handling Utilities
 * 
 * Centralized utilities for extracting and handling error messages
 * from API responses and exceptions.
 */

/**
 * Extracts error message from an error object
 * Tries multiple sources in order of preference:
 * 1. response.data.message (most specific)
 * 2. response.data (if string)
 * 3. error.message
 * 4. defaultMessage (fallback)
 */
export function extractErrorMessage(err: any, defaultMessage: string): string {
    if (err?.response?.data?.message) {
        return err.response.data.message;
    }
    
    if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
            return err.response.data;
        }
    }
    
    if (err?.message) {
        return err.message;
    }
    
    return defaultMessage;
}

/**
 * Extracts error message with optional logging
 */
export function extractErrorMessageWithLog(err: any, defaultMessage: string, logContext?: string): string {
    const message = extractErrorMessage(err, defaultMessage);
    
    if (logContext) {
        console.error(`${logContext}:`, err);
    }
    
    return message;
}

