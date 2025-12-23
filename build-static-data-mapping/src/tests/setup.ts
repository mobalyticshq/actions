import { config } from 'dotenv';
import { resolve } from 'path';

if (process.env.IS_DEV) {
  // Load .env file from project root
  // In Jest, __dirname points to the compiled JS location, so we use process.cwd() instead
  config({ path: resolve(process.cwd(), '.env') });
}
