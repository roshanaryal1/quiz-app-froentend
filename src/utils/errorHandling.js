// Enhanced error handling utilities
export class ApiError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const createApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return new ApiError(
      data?.message || 'Server error occurred',
      status,
      data?.code || 'SERVER_ERROR',
      data
    );
  } else if (error.request) {
    // Network error
    return new ApiError(
      'Network connection failed. Please check your internet connection.',
      0,
      'NETWORK_ERROR'
    );
  } else {
    // Client-side error
    return new ApiError(
      error.message || 'An unexpected error occurred',
      0,
      'CLIENT_ERROR'
    );
  }
};

export const handleApiError = (error, showToast = null) => {
  const apiError = createApiError(error);
  
  console.error(`[${apiError.code}] ${apiError.message}`, {
    status: apiError.status,
    details: apiError.details
  });

  if (showToast) {
    showToast(apiError.message, 'error');
  }

  return apiError;
};
