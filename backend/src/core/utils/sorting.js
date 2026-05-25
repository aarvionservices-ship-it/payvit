module.exports = (query) => {

    if (!query.sort) return { createdAt: -1 };

    const fields = query.sort.split(",");

    const sort = {};

    fields.forEach((f) => {
        sort[f] = 1;
    });

    return sort;

};
