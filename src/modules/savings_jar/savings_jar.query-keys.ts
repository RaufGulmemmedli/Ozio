/**
 * Query keys for the savings jar.
 *
 * One key: the jar is a single document and every write answers with the whole thing, so settings
 * and claim invalidate `savingsJarKeys.jar` rather than keeping a second cache entry.
 */
import { moduleKeys } from '@/core/query';

export const savingsJarKeys = {
  ...moduleKeys('savings-jar'),
  /** `GET /api/mock/savings_jar/jar`. */
  jar: ['savings-jar', 'jar'] as const,
} as const;
