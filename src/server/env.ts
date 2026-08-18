// src/server/env.ts
// Environment validation and configuration for EduWell Psych server.

import dotenv from "dotenv";

dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  cookieName: string;
  isProduction: boolean;
}

export function validateEnvironment(): ServerConfig {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";
  const port = parseInt(process.env.PORT || "3000", 10);

  let jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProduction) {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is missing in production!"
      );
    } else {
      console.warn(
        "⚠️  [AUTH WARN] JWT_SECRET not found in environment. Using development fallback key. DO NOT use in production."
      );
      jwtSecret = "eduwell_dev_jwt_fallback_secret_key_2026_do_not_use_in_prod";
    }
  }

  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
  const cookieName = "eduwell_token";

  return {
    port,
    nodeEnv,
    jwtSecret,
    jwtExpiresIn,
    cookieName,
    isProduction,
  };
}

export const serverConfig = validateEnvironment();
