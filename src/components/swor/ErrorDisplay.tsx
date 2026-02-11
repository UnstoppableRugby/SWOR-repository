import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, XCircle, AlertTriangle, Info, WifiOff, ShieldX, FileX, Clock, Ban } from 'lucide-react';

/**
 * ErrorDisplay Component for Steward Dashboard
 * 
 * Formats edge function errors consistently with:
 * - HTTP status code badge
 * - Human-readable message
 * - Optional 'Show Details' expandable section for technical info
 * - Never shows raw stack traces to users
 */

export interface EdgeFunctionError {
  // HTTP status code (e.g., 401, 403, 404, 500)
  statusCode?: number;
  // Error code from the API (e.g., 'auth_required', 'permission_denied')
  errorCode?: string;
  // Human-readable message for the user
  message: string;
  // Technical details (hidden by default, shown in expandable section)
  technicalDetails?: string;
  // Original error object (for debugging, never shown to users)
  originalError?: unknown;
  // Timestamp of when the error occurred
  timestamp?: Date;
  // Context about what operation failed
  context?: string;
}

interface ErrorDisplayProps {
  error: EdgeFunctionError | string | null;
  onDismiss?: () => void;
  className?: string;
  variant?: 'inline' | 'toast' | 'card';
  showTimestamp?: boolean;
}

// Map HTTP status codes to human-readable descriptions
const STATUS_CODE_LABELS: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  400: { label: 'Bad Request', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  401: { label: 'Unauthorized', color: 'bg-red-100 text-red-800 border-red-200', icon: <ShieldX className="w-3.5 h-3.5" /> },
  403: { label: 'Forbidden', color: 'bg-red-100 text-red-800 border-red-200', icon: <Ban className="w-3.5 h-3.5" /> },
  404: { label: 'Not Found', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <FileX className="w-3.5 h-3.5" /> },
  408: { label: 'Timeout', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  409: { label: 'Conflict', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  422: { label: 'Validation Error', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  429: { label: 'Too Many Requests', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  500: { label: 'Server Error', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  502: { label: 'Bad Gateway', color: 'bg-red-100 text-red-800 border-red-200', icon: <WifiOff className="w-3.5 h-3.5" /> },
  503: { label: 'Service Unavailable', color: 'bg-red-100 text-red-800 border-red-200', icon: <WifiOff className="w-3.5 h-3.5" /> },
  504: { label: 'Gateway Timeout', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
};

// Map error codes to human-readable messages
const ERROR_CODE_MESSAGES: Record<string, string> = {
  'auth_required': 'Please sign in to continue.',
  'permission_denied': 'You do not have permission to perform this action.',
  'not_found': 'The requested item could not be found.',
  'validation_error': 'Please check your input and try again.',
  'rate_limited': 'Too many requests. Please wait a moment and try again.',
  'network_error': 'Unable to connect. Please check your internet connection.',
  'timeout': 'The request took too long. Please try again.',
  'server_error': 'Something went wrong on our end. Please try again later.',
  'parse_error': 'We received an unexpected response. Please try again.',
  'steward_required': 'Steward access is required for this action.',
  'already_processed': 'This item has already been processed.',
  'invalid_status': 'This action cannot be performed on items with this status.',
};

/**
 * Parse an error into a standardized EdgeFunctionError format
 */
export function parseError(error: unknown, context?: string): EdgeFunctionError {
  // If already in the correct format, return as-is
  if (error && typeof error === 'object' && 'message' in error) {
    const err = error as EdgeFunctionError;
    return {
      ...err,
      context: context || err.context,
      timestamp: err.timestamp || new Date(),
    };
  }

  // If it's a string, try to parse it
  if (typeof error === 'string') {
    // Try to extract status code from common patterns like "Approve failed (401): ..."
    const statusMatch = error.match(/\((\d{3})\)/);
    const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : undefined;

    // Try to extract error code
    const codeMatch = error.match(/([a-z_]+):/i);
    const errorCode = codeMatch ? codeMatch[1].toLowerCase() : undefined;

    return {
      statusCode,
      errorCode,
      message: error,
      context,
      timestamp: new Date(),
      originalError: error,
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const statusMatch = error.message.match(/\((\d{3})\)/);
    const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : undefined;

    return {
      statusCode,
      message: error.message,
      technicalDetails: error.name !== 'Error' ? `${error.name}: ${error.message}` : undefined,
      context,
      timestamp: new Date(),
      originalError: error,
    };
  }

  // Fallback for unknown error types
  return {
    message: 'An unexpected error occurred. Please try again.',
    context,
    timestamp: new Date(),
    originalError: error,
  };
}

/**
 * Get a human-readable message for an error
 */
function getHumanReadableMessage(error: EdgeFunctionError): string {
  // If we have an error code, use its mapped message
  if (error.errorCode && ERROR_CODE_MESSAGES[error.errorCode]) {
    return ERROR_CODE_MESSAGES[error.errorCode];
  }

  // If we have a status code, provide context-aware messaging
  if (error.statusCode) {
    switch (error.statusCode) {
      case 401:
        return 'Authentication required. Please sign in and try again.';
      case 403:
        return 'You do not have permission to perform this action. Please contact a steward if you believe this is an error.';
      case 404:
        return 'The requested item could not be found. It may have been removed or moved.';
      case 422:
        return 'The request could not be processed. Please check your input and try again.';
      case 429:
        return 'Too many requests. Please wait a moment before trying again.';
      case 500:
      case 502:
      case 503:
        return 'We encountered a server error. Please try again in a few moments.';
      case 504:
        return 'The request timed out. Please try again.';
    }
  }

  // Return the original message, but sanitize it to remove technical details
  let message = error.message;
  
  // Remove stack traces (lines starting with "at ")
  message = message.replace(/\s+at\s+.+/g, '');
  
  // Remove file paths
  message = message.replace(/\/[^\s]+\.(ts|js|tsx|jsx)/g, '');
  
  // Remove line numbers
  message = message.replace(/:\d+:\d+/g, '');

  return message.trim() || 'An unexpected error occurred. Please try again.';
}

/**
 * Format technical details for the expandable section
 * Removes sensitive information like stack traces
 */
function formatTechnicalDetails(error: EdgeFunctionError): string | null {
  const details: string[] = [];

  if (error.statusCode) {
    details.push(`HTTP Status: ${error.statusCode}`);
  }

  if (error.errorCode) {
    details.push(`Error Code: ${error.errorCode}`);
  }

  if (error.context) {
    details.push(`Context: ${error.context}`);
  }

  if (error.timestamp) {
    details.push(`Time: ${error.timestamp.toLocaleTimeString()}`);
  }

  // Add technical details if available, but sanitize them
  if (error.technicalDetails) {
    // Remove stack traces
    let sanitized = error.technicalDetails.replace(/\s+at\s+.+/g, '');
    // Remove file paths
    sanitized = sanitized.replace(/\/[^\s]+\.(ts|js|tsx|jsx)/g, '[file]');
    if (sanitized.trim()) {
      details.push(`Details: ${sanitized.trim()}`);
    }
  }

  return details.length > 0 ? details.join('\n') : null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
  className = '',
  variant = 'inline',
  showTimestamp = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  // Normalize the error to EdgeFunctionError format
  const normalizedError: EdgeFunctionError = typeof error === 'string' 
    ? parseError(error) 
    : error;

  const humanMessage = getHumanReadableMessage(normalizedError);
  const technicalDetails = formatTechnicalDetails(normalizedError);
  const statusInfo = normalizedError.statusCode 
    ? STATUS_CODE_LABELS[normalizedError.statusCode] 
    : null;

  // Determine severity for styling
  const getSeverityStyles = () => {
    if (normalizedError.statusCode) {
      if (normalizedError.statusCode >= 500) {
        return 'bg-red-50 border-red-200 text-red-800';
      }
      if (normalizedError.statusCode === 401 || normalizedError.statusCode === 403) {
        return 'bg-red-50 border-red-200 text-red-800';
      }
      if (normalizedError.statusCode >= 400) {
        return 'bg-amber-50 border-amber-200 text-amber-800';
      }
    }
    return 'bg-red-50 border-red-200 text-red-800';
  };

  const severityStyles = getSeverityStyles();

  // Inline variant (default)
  if (variant === 'inline') {
    return (
      <div className={`rounded-lg border p-4 ${severityStyles} ${className}`}>
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="ml-3 flex-1">
            {/* Header with status badge */}
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="font-medium">Error</span>
              {statusInfo && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusInfo.color}`}>
                  {statusInfo.icon}
                  <span className="ml-1">{normalizedError.statusCode}</span>
                  <span className="ml-1 opacity-75">{statusInfo.label}</span>
                </span>
              )}
              {showTimestamp && normalizedError.timestamp && (
                <span className="text-xs opacity-60">
                  {normalizedError.timestamp.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Human-readable message */}
            <p className="text-sm">{humanMessage}</p>

            {/* Expandable technical details */}
            {technicalDetails && (
              <div className="mt-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center text-xs font-medium opacity-70 hover:opacity-100 transition-opacity"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 mr-1" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 mr-1" />
                      Show Details
                    </>
                  )}
                </button>
                {showDetails && (
                  <pre className="mt-2 p-2 bg-black/5 rounded text-xs font-mono whitespace-pre-wrap break-words max-h-32 overflow-auto">
                    {technicalDetails}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss error"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Toast variant (more compact)
  if (variant === 'toast') {
    return (
      <div className={`rounded-lg border p-3 shadow-lg ${severityStyles} ${className}`}>
        <div className="flex items-start">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="ml-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {statusInfo && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusInfo.color}`}>
                  {normalizedError.statusCode}
                </span>
              )}
              <span className="text-sm font-medium truncate">{humanMessage}</span>
            </div>
            {technicalDetails && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[10px] opacity-70 hover:opacity-100 mt-1 flex items-center"
              >
                {showDetails ? 'Hide details' : 'Show details'}
                {showDetails ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
              </button>
            )}
            {showDetails && technicalDetails && (
              <pre className="mt-1 p-1.5 bg-black/5 rounded text-[10px] font-mono whitespace-pre-wrap break-words max-h-24 overflow-auto">
                {technicalDetails}
              </pre>
            )}
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card variant (more detailed, for dashboard sections)
  if (variant === 'card') {
    return (
      <div className={`rounded-xl border-2 p-5 ${severityStyles} ${className}`}>
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-current/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="ml-4 flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Something went wrong</h4>
              {statusInfo && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                  {statusInfo.icon}
                  <span className="ml-1.5">{normalizedError.statusCode} {statusInfo.label}</span>
                </span>
              )}
            </div>

            {/* Message */}
            <p className="text-sm mb-3">{humanMessage}</p>

            {/* Context if available */}
            {normalizedError.context && (
              <p className="text-xs opacity-70 mb-3">
                <span className="font-medium">While:</span> {normalizedError.context}
              </p>
            )}

            {/* Technical details */}
            {technicalDetails && (
              <div className="border-t border-current/10 pt-3 mt-3">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center text-xs font-medium opacity-70 hover:opacity-100 transition-opacity"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Hide Technical Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show Technical Details
                    </>
                  )}
                </button>
                {showDetails && (
                  <pre className="mt-3 p-3 bg-black/5 rounded-lg text-xs font-mono whitespace-pre-wrap break-words max-h-40 overflow-auto">
                    {technicalDetails}
                  </pre>
                )}
              </div>
            )}

            {/* Timestamp */}
            {showTimestamp && normalizedError.timestamp && (
              <p className="text-[10px] opacity-50 mt-3">
                {normalizedError.timestamp.toLocaleString()}
              </p>
            )}
          </div>

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-4 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss error"
            >
              <XCircle className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ErrorDisplay;
