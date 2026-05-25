const settingsService = require('../service/settings.service');

class SettingsController {
    async getSettings(req, res) {
        try {
            const settings = await settingsService.getSettings();
            res.status(200).json({ success: true, data: settings });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateSettings(req, res) {
        try {
            const settings = await settingsService.updateSettings(req.body);
            res.status(200).json({ success: true, data: settings });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new SettingsController();

