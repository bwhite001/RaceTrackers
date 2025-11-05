import { BaseRepository } from './BaseRepository';

export class SettingsRepository extends BaseRepository {
  constructor() {
    super('settings');
  }

  async getSetting(key, defaultValue = null) {
    try {
      const setting = await this.table.get(key);
      return setting ? setting.value : defaultValue;
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultValue;
    }
  }

  async saveSetting(key, value) {
    try {
      await this.table.put({ key, value });
    } catch (error) {
      console.error('Error saving setting:', error);
      throw new Error(`Failed to save setting: ${key}`);
    }
  }

  async getAllSettings() {
    try {
      const settings = await this.getAll();
      return settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting all settings:', error);
      return {};
    }
  }

  async clearSettings() {
    try {
      await this.table.clear();
    } catch (error) {
      console.error('Error clearing settings:', error);
      throw new Error('Failed to clear settings');
    }
  }
}

export default new SettingsRepository();
