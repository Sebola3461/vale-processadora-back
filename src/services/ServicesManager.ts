import { DatabaseService } from "./database/DatabaseService";

export class ServicesManager {
  public static Database = DatabaseService;

  public static async AuthenticateAll() {
    await this.Database.connect();
  }
}
