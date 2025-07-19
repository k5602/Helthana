# Comprehensive Error Handling System

## Overview

The Health Guide application implements a comprehensive error handling system that provides standardized error responses, user-friendly messages, offline support, and robust error recovery mechanisms.

## Architecture

### Backend Error Handling

#### Standardized Error Response Format
All API endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "details": {
      "field_name": ["Field-specific error message"]
    },
    "timestamp": "2025-01-19T12:00:00.000Z"
  }
}
```

#### Error Codes
The system uses standardized error codes for different scenarios:

**Authentication Errors:**
- `LOGIN_FAILED` - General login failure
- `INVALID_CREDENTIALS` - Invalid username/password
- `ACCOUNT_LOCKED` - Account temporarily locked
- `EMAIL_NOT_VERIFIED` - Email verification required
- `EXPIRED_TOKEN` - Session expired

**Validation Errors:**
- `VALIDATION_ERROR` - Form validation failed
- `REGISTRATION_FAILED` - Registration validation failed
- `WEAK_PASSWORD` - Password doesn't meet requirements

**Server Errors:**
- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable
- `DATABASE_ERROR` - Database operation failed

#### Backend Implementation

The backend uses several key components:

1. **AuthErrorCodes** - Centralized error code constants
2. **AuthErrorMessages** - User-friendly error messages
3. **StandardizedErrorResponse** - Creates consistent error responses
4. **AuthErrorHandler** - Handles different types of authentication errors

### Frontend Error Handling

#### Global Error Handler
The frontend implements a comprehensive `ErrorHandler` class that:

- Parses different error formats (API responses, network errors, validation errors)
- Provides user-friendly error messages
- Handles offline scenarios
- Implements retry logic with exponential backoff
- Logs errors for debugging
- Displays errors using appropriate UI components

#### Error Types

**Network Errors:**
- Connection failures
- CORS issues
- Timeout errors
- Server unavailable

**Authentication Errors:**
- Invalid credentials
- Token expiration
- Account lockout
- Email verification required

**Validation Errors:**
- Form field validation
- Data format errors
- Required field missing

**Offline Errors:**
- Actions attempted while offline
- Data synchronization issues
- Queue management

## Features

### 1. Standardized Error Responses

All errors follow a consistent format making it easy for the frontend to handle them uniformly.

### 2. User-Friendly Messages

Technical error codes are translated into user-friendly messages that help users understand what went wrong and how to fix it.

### 3. Field-Specific Validation

Form validation errors are displayed next to the relevant form fields with clear instructions.

### 4. Offline Support

The system gracefully handles offline scenarios by:
- Detecting offline status
- Queuing failed actions for retry
- Providing offline-specific error messages
- Automatically retrying when connection is restored

### 5. Retry Logic

Failed requests are automatically retried with exponential backoff for recoverable errors.

### 6. Error Logging

All errors are logged locally for debugging purposes, including:
- Error details and context
- User agent and URL information
- Timestamp and online status

### 7. Progressive Enhancement

The error handling system works even if some components are not available, providing fallback mechanisms.

## Usage Examples

### Backend Usage

```python
from .error_handlers import StandardizedErrorResponse, AuthErrorCodes

# Create a validation error response
return StandardizedErrorResponse.create_validation_error_response(
    serializer.errors
)

# Create an authentication error
return StandardizedErrorResponse.create_authentication_error_response(
    error_code=AuthErrorCodes.INVALID_CREDENTIALS
)
```

### Frontend Usage

```javascript
// Handle API errors
try {
    const result = await window.api.login(username, password);
} catch (error) {
    const errorResult = window.errorHandler.handleError(error, {
        action: 'login',
        type: 'auth',
        containerId: 'login-form'
    });
}

// Handle validation errors
window.errorHandler.displayFieldErrors({
    username: ['Username is required'],
    email: ['Please enter a valid email']
}, { formElement: document.getElementById('signup-form') });

// Handle offline errors
if (!navigator.onLine) {
    window.errorHandler.handleOfflineError(
        { isOfflineError: true },
        { action: 'save prescription' }
    );
}
```

## Configuration

### Backend Configuration

Error handling is configured in `backend/apps/authentication/error_handlers.py`:

- Customize error codes in `AuthErrorCodes`
- Modify error messages in `AuthErrorMessages`
- Adjust error response format in `StandardizedErrorResponse`

### Frontend Configuration

Error handling is configured in `frontend/src/error-handler.js`:

- Modify retry attempts: `maxRetryAttempts`
- Adjust error queue size: `errorQueue` limit
- Customize error display methods

## Testing

A comprehensive test suite is available at `/test-error-handling.html` that demonstrates:

- Authentication error scenarios
- Validation error handling
- Offline error management
- Server error responses
- Retry logic functionality
- Error logging capabilities

## Best Practices

### Backend
1. Always use standardized error responses
2. Provide specific error codes for different scenarios
3. Include helpful error messages
4. Log security-related errors for audit purposes
5. Don't expose sensitive information in error messages

### Frontend
1. Use the global error handler for consistent error handling
2. Provide context when handling errors (action, type, etc.)
3. Display field-specific errors near form fields
4. Handle offline scenarios gracefully
5. Implement retry logic for recoverable errors
6. Log errors for debugging but don't expose sensitive data

## Error Recovery

The system implements several error recovery mechanisms:

1. **Automatic Token Refresh** - Expired tokens are automatically refreshed
2. **Retry Logic** - Failed requests are retried with exponential backoff
3. **Offline Queue** - Actions are queued when offline and retried when online
4. **Graceful Degradation** - The app continues to function even with errors
5. **User Guidance** - Clear instructions help users resolve issues

## Monitoring and Debugging

### Error Logging
- All errors are logged with context information
- Error logs are stored locally for debugging
- Sensitive information is never logged

### Error Analytics
- Error patterns can be analyzed from logs
- Network connectivity issues are tracked
- User experience impact is measurable

## Security Considerations

1. **No Sensitive Data Exposure** - Error messages never expose passwords, tokens, or other sensitive data
2. **Rate Limiting** - Failed authentication attempts are tracked and limited
3. **Audit Logging** - Security-related errors are logged for audit purposes
4. **Input Validation** - All user input is validated to prevent injection attacks
5. **CORS Protection** - Network errors include CORS-related error handling

## Future Enhancements

1. **Error Analytics Dashboard** - Visual representation of error patterns
2. **Advanced Retry Strategies** - More sophisticated retry logic based on error type
3. **User Feedback Integration** - Allow users to report errors directly
4. **Internationalization** - Multi-language error messages
5. **Performance Monitoring** - Track error impact on application performance