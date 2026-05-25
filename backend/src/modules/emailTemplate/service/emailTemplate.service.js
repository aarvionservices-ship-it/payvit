const emailTemplateRepository = require('../repository/emailTemplate.repository');
const emailService = require('../../../core/utils/email');

class EmailTemplateService {
    async createTemplate(data) {
        if (data.name && !data.slug) {
            data.slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }
        return await emailTemplateRepository.create(data);
    }

    async getTemplates(query) {
        return await emailTemplateRepository.findAll(query);
    }

    async getTemplateById(id) {
        return await emailTemplateRepository.findById(id);
    }

    async updateTemplate(id, data) {
        return await emailTemplateRepository.update(id, data);
    }

    async deleteTemplate(id) {
        return await emailTemplateRepository.delete(id);
    }

    /**
     * Replace tokens in the template body with actual data
     * @param {string} body - The HTML body with tokens like {{username}}
     * @param {Object} data - The data object containing values for tokens
     * @returns {string} - The body with replaced values
     */
    replaceTokens(body, data) {
        let replacedBody = body;
        const tokens = {
            username: data.username || 'User',
            phone: data.phone || '',
            email: data.email || '',
            loanAmount: data.loanAmount || '',
            cardName: data.cardName || '',
            rechargeAmount: data.rechargeAmount || '',
            otp: data.otp || '',
            ...data
        };

        Object.keys(tokens).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            replacedBody = replacedBody.replace(regex, tokens[key]);
        });

        return replacedBody;
    }

    /**
     * Send email using a template slug
     * @param {string} slug - The slug of the template
     * @param {string} to - Recipient email
     * @param {Object} data - Data for token replacement
     */
    async sendEmailWithTemplate(slug, to, data) {
        const template = await emailTemplateRepository.findBySlug(slug);
        if (!template || !template.isActive) {
            throw new Error(`Template not found or inactive: ${slug}`);
        }

        const html = this.replaceTokens(template.body, data);
        const subject = this.replaceTokens(template.subject, data);

        return await emailService.sendEmail({
            to,
            subject,
            html,
            text: html.replace(/<[^>]*>?/gm, '') // Simple HTML to text conversion
        });
    }
}

module.exports = new EmailTemplateService();

