import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { buildServiceWorker } from './build-service-worker';

export default function nativePwa(): AstroIntegration {
  return {
    name: 'astro-blog-native-pwa',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const result = await buildServiceWorker(fileURLToPath(dir));
        logger.info(`generated sw.js with ${result.entryCount} precache entries (${result.releaseId})`);
      },
    },
  };
}
