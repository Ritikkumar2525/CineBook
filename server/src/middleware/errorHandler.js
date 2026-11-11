const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.code = err.code;

  if (process.env.NODE_ENV !== 'test') {
    console.error('Error encountered:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    message = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  // Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue).join(', ') : 'field';
    message = `Duplicate value entered for ${field}. Please use another value.`;
    statusCode = 400;
    errors = err.keyValue;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    statusCode = 400;
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Authentication token has expired';
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors || undefined,
  });
};

module.exports = errorHandler;
