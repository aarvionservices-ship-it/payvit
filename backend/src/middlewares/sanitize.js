const { filterXSS } = require("xss");

/**
 * Recursive function to clean data from XSS and MongoDB Injection
 * @param {any} data - The data to clean
 * @returns {any} - The cleaned data
 */
const cleanData = (data) => {
    if (typeof data === "string") {
        return filterXSS(data);
    }

    if (Array.isArray(data)) {
        return data.map((item) => cleanData(item));
    }

    if (data !== null && typeof data === "object") {
        const cleanedData = {};
        Object.keys(data).forEach((key) => {
            // MongoDB Injection Protection: skip keys starting with $
            if (key.startsWith("$")) {
                return;
            }
            cleanedData[key] = cleanData(data[key]);
        });
        return cleanedData;
    }

    return data;
};

/**
 * Middleware to protect against XSS and MongoDB Operator Injection
 */
const sanitize = () => {
    return (req, res, next) => {
        if (req.body) {
            req.body = cleanData(req.body);
        }

        if (req.query) {
            // In Express 5, req.query is a getter/setter that doesn't allow direct reassignment 
            // of the entire object in some environments. We update keys individually.
            const cleanedQuery = cleanData(req.query);

            // Clear existing keys to handle deletion of $ keys
            Object.keys(req.query).forEach(key => delete req.query[key]);
            // Apply cleaned keys
            Object.assign(req.query, cleanedQuery);
        }

        if (req.params) {
            const cleanedParams = cleanData(req.params);
            Object.assign(req.params, cleanedParams);
        }

        next();
    };
};

module.exports = sanitize;

