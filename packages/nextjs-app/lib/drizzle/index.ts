import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
const pool = new Pool({
	connectionString: process.env.DATABASE_URL!,
	idleTimeoutMillis: 3600, // 空闲连接超时时间
});
export const db = drizzle({ client: pool });
