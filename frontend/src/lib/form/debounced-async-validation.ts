const DEFAULT_DEBOUNCE_MS = 450;

export type DebouncedAvailabilityOptions = {
  debounceMs?: number;
  /** Default: `String(value ?? "").trim()` */
  normalize?: (value: unknown) => string;
  /**
   * When true, resolve as available immediately (no API).
   * Default: normalized string is empty.
   */
  skipWhen?: (normalized: string) => boolean;
  /** `true` means value passes validation (e.g. unique / available). */
  checkAvailable: (normalized: string) => Promise<boolean>;
  /**
   * When a newer call supersedes this one, treat as pass so stale results do not block the form.
   * @default true
   */
  stalePasses?: boolean;
};

/**
 * Debounced async check with generation-based stale resolution.
 * Returns `Promise<boolean>` where `true` means validation passes (value is available).
 */
export function createDebouncedAvailabilityValidator(
  options: DebouncedAvailabilityOptions,
): (value: unknown) => Promise<boolean> {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const normalize =
    options.normalize ?? ((v: unknown) => String(v ?? "").trim());
  const skipWhen = options.skipWhen ?? ((s: string) => s.length === 0);
  const stalePasses = options.stalePasses ?? true;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let generation = 0;
  const waiters = new Map<number, (pass: boolean) => void>();

  function resolveStaleWaiters(currentGen: number) {
    for (const [id, resolve] of waiters) {
      if (id < currentGen) {
        resolve(stalePasses);
        waiters.delete(id);
      }
    }
  }

  return (value: unknown): Promise<boolean> => {
    return new Promise((resolve) => {
      const normalized = normalize(value);
      if (skipWhen(normalized)) {
        resolve(true);
        return;
      }

      generation += 1;
      const g = generation;
      resolveStaleWaiters(g);

      waiters.set(g, resolve);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }

      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void (async () => {
          try {
            const available = await options.checkAvailable(normalized);
            const finish = waiters.get(g);
            if (!finish) return;
            waiters.delete(g);
            finish(available);
          } catch {
            const finish = waiters.get(g);
            if (!finish) return;
            waiters.delete(g);
            finish(true);
          }
        })();
      }, debounceMs);
    });
  };
}

export type DebouncedRHFUniqueOptions = DebouncedAvailabilityOptions & {
  /** Shown when `checkAvailable` resolves `false`. */
  takenMessage: string;
};

/**
 * React Hook Form async validate: `true` if valid, otherwise error string.
 */
export function createDebouncedRHFUniqueValidator(
  options: DebouncedRHFUniqueOptions,
): (value: unknown) => Promise<true | string> {
  const run = createDebouncedAvailabilityValidator(options);
  const { takenMessage } = options;
  return async (value) => {
    const ok = await run(value);
    return ok ? true : takenMessage;
  };
}
