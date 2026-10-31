import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: env('DIRECT_URL') || env('DATABASE_URL'),
  },
  migrations: {
    seed: 'ts-node prisma/seeder/index.ts',
  },
});
