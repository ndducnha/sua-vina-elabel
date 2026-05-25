/** Allowed characters for batch / lot serial: Latin letters, digits, hyphen (empty string allowed while typing). */
const BATCH_CODE_CHARSET_PATTERN = /^[A-Za-z0-9-]*$/;

export function isBatchCodeCharacterSetValid(value: string): boolean {
  return BATCH_CODE_CHARSET_PATTERN.test(value);
}
