import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from '../../src/config/base-config.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

function resolveConfigDirectory(): string {
  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  const searchPaths = [
    join(currentFileDir, '..', '..', 'config'),
    join(currentFileDir, '..', 'config'),
    join(currentFileDir, 'config'),
  ];

  for (const rootConfigDir of searchPaths) {
    if (existsSync(rootConfigDir)) {
      return rootConfigDir;
    }
  }

  throw new Error(`Config directory not found.`);
}

export const appConfig = loadConfig(resolveConfigDirectory(), CustomConfig);
export const API_BASE_URL = `http://localhost:${appConfig.port}/api/v1`;
