const Settings = require('../model/settings.model');

class SettingsService {
    async getSettings() {
        let settings = await Settings.findOne({ key: 'app_settings' });
        if (!settings) {
            // Create default settings if not exists
            settings = await Settings.create({ key: 'app_settings' });
        }
        return settings;
    }

    async updateSettings(data) {
        return await Settings.findOneAndUpdate(
            { key: 'app_settings' },
            { $set: data },
            { new: true, upsert: true }
        );
    }
}

module.exports = new SettingsService();

