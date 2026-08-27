export const errorHandler = (err, req, res, next) => {
    console.error('--- ERROR ---');
    console.error('Route:', req.method, req.originalUrl);
    console.error('Body:', req.body);
    console.error(err.stack);
    console.error('-------------');

    res.status(500).json({
        error: 'Something went wrong!',
        // TEMPORARY for local debugging only — remove before deploying
        debug: err.message
    });
};