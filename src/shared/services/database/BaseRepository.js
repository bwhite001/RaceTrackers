import db from './schema';

export class BaseRepository {
  constructor(tableName) {
    this.table = db[tableName];
    if (!this.table) {
      throw new Error(`Table ${tableName} does not exist in database`);
    }
  }

  async getById(id) {
    try {
      return await this.table.get(id);
    } catch (error) {
      console.error(`Error getting record by id from ${this.table.name}:`, error);
      throw error;
    }
  }

  async getAll() {
    try {
      return await this.table.toArray();
    } catch (error) {
      console.error(`Error getting all records from ${this.table.name}:`, error);
      throw error;
    }
  }

  async add(data) {
    try {
      const id = await this.table.add(data);
      return id;
    } catch (error) {
      console.error(`Error adding record to ${this.table.name}:`, error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      await this.table.update(id, data);
      return await this.getById(id);
    } catch (error) {
      console.error(`Error updating record in ${this.table.name}:`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      await this.table.delete(id);
    } catch (error) {
      console.error(`Error deleting record from ${this.table.name}:`, error);
      throw error;
    }
  }

  async bulkAdd(items) {
    try {
      return await this.table.bulkAdd(items);
    } catch (error) {
      console.error(`Error bulk adding records to ${this.table.name}:`, error);
      throw error;
    }
  }

  async bulkUpdate(items) {
    try {
      await db.transaction('rw', this.table, async () => {
        for (const item of items) {
          await this.table.update(item.id, item);
        }
      });
    } catch (error) {
      console.error(`Error bulk updating records in ${this.table.name}:`, error);
      throw error;
    }
  }

  async where(criteria) {
    try {
      return await this.table.where(criteria).toArray();
    } catch (error) {
      console.error(`Error querying records in ${this.table.name}:`, error);
      throw error;
    }
  }
}
