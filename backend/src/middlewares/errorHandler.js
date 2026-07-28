module.exports = (err, req, res, next) => {

    // Only log full error details outside of test runs
    if (process.env.NODE_ENV !== "test") {
        console.error(err);
    }

    const message = err.message || "Internal Server Error";
    res.status(err.statusCode || 500).json({
        success: false,
        message,
        errors: err.errors || [message]
    });

};
