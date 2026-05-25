const EmailTemplate = require('../model/emailTemplate.model');

class EmailTemplateRepository {
    async create(data) {
        return await EmailTemplate.create(data);
    }

    async findAll(query = {}) {
        return await EmailTemplate.find(query).sort({ createdAt: -1 });
    }

    async findById(id) {
        return await EmailTemplate.findById(id);
    }

    async findBySlug(slug) {
        return await EmailTemplate.findOne({ slug });
    }

    async update(id, data) {
        return await EmailTemplate.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return await EmailTemplate.findByIdAndDelete(id);
    }
}

module.exports = new EmailTemplateRepository();

