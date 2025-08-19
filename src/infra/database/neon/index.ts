// database.ts
import { Injectable } from "@kernel/decorators/Injectable";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import { AppConfig } from "@shared/config/AppConfig";

@Injectable()
export class DatabaseService {
  public readonly db: NeonHttpDatabase;

  constructor(private readonly config: AppConfig) {
    const url = this.config.db?.url;
    if (!url) {
      throw new Error("DATABASE_URL não configurada em AppConfig.database.url");
    }

    // Instância do Drizzle sobre o cliente HTTP do Neon
    this.db = drizzle(url);
  }
}
