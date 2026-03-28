// D1 Database wrapper for Cloudflare
// This replaces Sequelize for lightweight ORM-like functionality

export interface Database {
  prepare(query: string): any;
  exec(query: string): Promise<any>;
  batch(queries: string[]): Promise<any[]>;
}

export class D1Adapter {
  constructor(private db: any) {}

  async execute(query: string, params?: any[]): Promise<any> {
    try {
      const statement = this.db.prepare(query);
      if (Array.isArray(params) && params.length > 0) {
        return statement.bind(...params).all();
      }
      return statement.all();
    } catch (error) {
      console.error("D1 Query Error:", error);
      throw error;
    }
  }

  async insert(table: string, data: Record<string, any>): Promise<any> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => "?").join(", ");

    const query = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
    return this.execute(query, values);
  }

  async update(
    table: string,
    data: Record<string, any>,
    where: Record<string, any>
  ): Promise<any> {
    const updateColumns = Object.keys(data);
    const updateSet = updateColumns.map((col) => `${col} = ?`).join(", ");
    const updateValues = Object.values(data);

    const whereColumns = Object.keys(where);
    const whereCondition = whereColumns.map((col) => `${col} = ?`).join(" AND ");
    const whereValues = Object.values(where);

    const query = `UPDATE ${table} SET ${updateSet} WHERE ${whereCondition}`;
    return this.execute(query, [...updateValues, ...whereValues]);
  }

  async delete(table: string, where: Record<string, any>): Promise<any> {
    const whereColumns = Object.keys(where);
    const whereCondition = whereColumns.map((col) => `${col} = ?`).join(" AND ");
    const whereValues = Object.values(where);

    const query = `DELETE FROM ${table} WHERE ${whereCondition}`;
    return this.execute(query, whereValues);
  }

  async findAll(table: string, where?: Record<string, any>): Promise<any[]> {
    let query = `SELECT * FROM ${table}`;
    let params: any[] = [];

    if (where) {
      const whereColumns = Object.keys(where);
      const whereCondition = whereColumns.map((col) => `${col} = ?`).join(" AND ");
      query += ` WHERE ${whereCondition}`;
      params = Object.values(where);
    }

    return this.execute(query, params);
  }

  async findOne(table: string, where: Record<string, any>): Promise<any> {
    const results = await this.findAll(table, where);
    return results[0] || null;
  }

  async count(table: string, where?: Record<string, any>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    let params: any[] = [];

    if (where) {
      const whereColumns = Object.keys(where);
      const whereCondition = whereColumns.map((col) => `${col} = ?`).join(" AND ");
      query += ` WHERE ${whereCondition}`;
      params = Object.values(where);
    }

    const result = await this.execute(query, params);
    return result[0]?.count || 0;
  }
}
