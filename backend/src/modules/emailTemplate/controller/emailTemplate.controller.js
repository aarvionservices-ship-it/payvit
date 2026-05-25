const emailTemplateService = require('../service/emailTemplate.service');

class EmailTemplateController {
    async create(req, res, next) {
        try {
            const template = await emailTemplateService.createTemplate(req.body);
            res.status(201).json({
                success: true,
                data: template
            });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const templates = await emailTemplateService.getTemplates(req.query);
            res.status(200).json({
                success: true,
                data: templates
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const template = await emailTemplateService.getTemplateById(req.params.id);
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }
            res.status(200).json({
                success: true,
                data: template
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const template = await emailTemplateService.updateTemplate(req.params.id, req.body);
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }
            res.status(200).json({
                success: true,
                data: template
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const result = await emailTemplateService.deleteTemplate(req.params.id);
            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Template deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async testTemplate(req, res, next) {
        try {
            const { id, email, testData } = req.body;
            const template = await emailTemplateService.getTemplateById(id);
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }

            const result = await emailTemplateService.sendEmailWithTemplate(template.slug, email, testData || {});
            res.status(200).json({
                success: true,
                message: 'Test email sent successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EmailTemplateController();

