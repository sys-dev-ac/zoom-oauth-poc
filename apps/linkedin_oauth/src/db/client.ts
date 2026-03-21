import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

class DBclient {
  private client;
  constructor() {
    this.client = new Client(process.env.DATABASE_URL);
  }

  async connect() {
    await this.client.connect();
  }

  getClient() {
    return this.client;
  }
}

export { DBclient };
