module.exports = (query) => {

    const filter = { ...query };

    const excluded = ["page", "limit", "sort"];

    excluded.forEach((f) => delete filter[f]);

    return filter;

};
