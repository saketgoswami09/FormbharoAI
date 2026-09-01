export const errorHandler = (err, req, res, next) => {
    console.error('--- ERROR ---');
    console.error('Route:', req.method, req.originalUrl);
    console.error('Body:', req.body);
    console.error(err.stack);
    console.error('-------------');

    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        error: 'Something went wrong!',
        ...(process.env.NODE_ENV !== 'production' && { debug: err.message })
    });
};