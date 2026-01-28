import pkg from '../../../package.json' with { type: 'json' };
import dotenv from 'dotenv';
import { join } from 'node:path';
import { getOsEnv, getOsEnvOptional, normalizePort } from '~/global/utils/index.js';

/**
 * Load .env file or for tests the .env.test file.
 */
const postfix = process.env.NODE_ENV?.toLowerCase().includes('prod')
    ? ''
    : process.env.NODE_ENV?.toLowerCase().includes('dev')
      ? '.dev'
      : '.' + process.env.NODE_ENV;
dotenv.config({ path: join(process.cwd(), `.env${postfix}`) });

/**
 * Environment variables
 */
export const env = {
    mode: {
        prod: process.env.NODE_ENV?.toLowerCase().includes('prod'),
        dev: process.env.NODE_ENV?.toLowerCase().includes('dev'),
        test: process.env.NODE_ENV?.toLowerCase().includes('test'),
        local: process.env.NODE_ENV?.toLowerCase().includes('local'),
        value: process.env.NODE_ENV?.toLowerCase(),
    },
    mongodb: {
        url: getOsEnv('MONGODB_URL'),
    },
    mysql: {
        host: getOsEnv('MYSQL_HOST'),
        port: getOsEnv('MYSQL_PORT'),
        username: getOsEnv('MYSQL_USERNAME'),
        password: getOsEnv('MYSQL_PASSWORD'),
        schema: getOsEnv('MYSQL_SCHEMA'),
    },
    app: {
        name: getOsEnv('APP_NAME'),
        version: pkg.version,
        description: pkg.description,
        port: normalizePort(getOsEnv('APP_PORT')),
    },
    jwt: {
        secret: getOsEnv('JWT_SECRET'),
        expire: {
            access: getOsEnv('JWT_EXPIRE_ACCESS'),
            refresh: getOsEnv('JWT_EXPIRE_REFRESH'),
        },
    },
    ga4: {
        measurementId: getOsEnvOptional('GA4_MEASUREMENT_ID'),
        apiSecret: getOsEnvOptional('GA4_API_SECRET'),
    },
    smtp: {
        user: getOsEnvOptional('SMTP_USER'),
        pass: getOsEnvOptional('SMTP_PASS'),
        adminEmail: getOsEnvOptional('ADMIN_EMAIL'),
    },
};
