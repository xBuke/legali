/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 */

interface EnvironmentConfig {
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: string;
}

interface OptionalEnvironmentConfig {
  STRIPE_SECRET_KEY?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_BASIC_PRICE_ID?: string;
  STRIPE_PRO_PRICE_ID?: string;
  STRIPE_ENTERPRISE_PRICE_ID?: string;
  BLOB_READ_WRITE_TOKEN?: string;
  OPENAI_API_KEY?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  SENTRY_DSN?: string;
}

export type FullEnvironmentConfig = EnvironmentConfig & OptionalEnvironmentConfig;

/**
 * Required environment variables that must be present
 */
const REQUIRED_ENV_VARS: (keyof EnvironmentConfig)[] = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'NODE_ENV'
];

/**
 * Validates that all required environment variables are present
 */
export function validateRequiredEnvironment(): EnvironmentConfig {
  const missing: string[] = [];
  const config: Partial<EnvironmentConfig> = {};

  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else {
      config[key] = value as any;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env.local file and ensure all required variables are set.`
    );
  }

  return config as EnvironmentConfig;
}

/**
 * Validates environment variable formats and values
 */
export function validateEnvironmentFormats(config: EnvironmentConfig): void {
  const errors: string[] = [];

  // Validate NEXTAUTH_SECRET length
  if (config.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters long');
  }

  // Validate URLs
  try {
    new URL(config.NEXTAUTH_URL);
  } catch {
    errors.push('NEXTAUTH_URL must be a valid URL');
  }

  try {
    new URL(config.NEXT_PUBLIC_APP_URL);
  } catch {
    errors.push('NEXT_PUBLIC_APP_URL must be a valid URL');
  }

  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(config.NODE_ENV)) {
    errors.push('NODE_ENV must be one of: development, production, test');
  }

  // Validate DATABASE_URL format
  if (!config.DATABASE_URL.startsWith('postgres://') && !config.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation errors:\n${errors.join('\n')}`);
  }
}

/**
 * Gets all environment variables (required + optional)
 */
export function getAllEnvironmentConfig(): FullEnvironmentConfig {
  const required = validateRequiredEnvironment();
  validateEnvironmentFormats(required);

  const optional: OptionalEnvironmentConfig = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_BASIC_PRICE_ID: process.env.STRIPE_BASIC_PRICE_ID,
    STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
    STRIPE_ENTERPRISE_PRICE_ID: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SENTRY_DSN: process.env.SENTRY_DSN,
  };

  return { ...required, ...optional };
}

/**
 * Validates environment on application startup
 * Call this in your main application files
 */
export function validateEnvironmentOnStartup(): FullEnvironmentConfig {
  try {
    const config = getAllEnvironmentConfig();
    console.log('✅ Environment validation passed');
    return config;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown environment validation error';
    console.error('❌ Environment validation failed:', errorMessage);
    throw error;
  }
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get environment status for debugging
 */
export function getEnvironmentStatus() {
  const required = REQUIRED_ENV_VARS.map(key => ({
    key,
    present: !!process.env[key],
    value: process.env[key] ? '***' : undefined
  }));

  const optional = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'BLOB_READ_WRITE_TOKEN',
    'OPENAI_API_KEY'
  ].map(key => ({
    key,
    present: !!process.env[key],
    value: process.env[key] ? '***' : undefined
  }));

  return {
    nodeEnv: process.env.NODE_ENV,
    required,
    optional,
    timestamp: new Date().toISOString()
  };
}
