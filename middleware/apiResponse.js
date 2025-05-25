// API Response middleware
const apiResponse = (req, res, next) => {
    // Success response
    res.apiSuccess = (data, message = 'Success') => {
        res.json({
            success: true,
            message,
            data
        });
    };

    // Error response
    res.apiError = (error, status = 500) => {
        res.status(status).json({
            success: false,
            error: error.message || error
        });
    };

    // Not found response
    res.apiNotFound = (message = 'Resource not found') => {
        res.status(404).json({
            success: false,
            error: message
        });
    };

    // Validation error response
    res.apiValidationError = (errors) => {
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors
        });
    };

    // Unauthorized response
    res.apiUnauthorized = (message = 'Unauthorized access') => {
        res.status(401).json({
            success: false,
            error: message
        });
    };

    // Forbidden response
    res.apiForbidden = (message = 'Access forbidden') => {
        res.status(403).json({
            success: false,
            error: message
        });
    };

    next();
};

module.exports = apiResponse; 