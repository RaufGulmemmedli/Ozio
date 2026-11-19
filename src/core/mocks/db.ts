/**
 * `createMockDb` — the in-memory store every mock module keeps its demo state in.
 *
 * Persisted to `localStorage` under `ozio.mock.<key>` so a reload keeps the demo going (a parcel
 * stays in flight, a courier application stays approved, a savings jar keeps its balance).
 *
 * SSR-safe: with no `window` it is a plain in-memory value and nothing is read or written.
 */
const PREFIX = 'ozio.mock.';

export interface MockDb<T> {
  /** The `localStorage` key, `ozio.mock.<key>`. */
  readonly storageKey: string;
  /** The current value. Never `undefined`. */
  get(): T;
  /** Replaces the value (or derives the next one) and persists it. Returns the new value. */
  set(next: T | ((prev: T) => T)): T;
  /** Shallow-merges into an object value. */
  patch(part: Partial<T>): T;
  /** Back to the seed. */
  reset(): T;
  /** Fires after every `set`/`patch`/`reset`. */
  subscribe(fn: (value: T) => void): () => void;
}

const canStore = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return typeof window.localStorage !== 'undefined';
  } catch {
    // Safari with site data blocked throws on access
    return false;
  }
};

function clone<T>(v: T): T {
  if (v === null || typeof v !== 'object') return v;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(v);
    } catch {
      // fall through to JSON
    }
  }
  return JSON.parse(JSON.stringify(v)) as T;
}

export function createMockDb<T>(key: string, seed: T | (() => T)): MockDb<T> {
  const storageKey = `${PREFIX}${key}`;
  const makeSeed = (): T => clone(typeof seed === 'function' ? (seed as () => T)() : seed);

  const listeners = new Set<(value: T) => void>();
  let value: T = read();

  function read(): T {
    if (!canStore()) return makeSeed();
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return makeSeed();
      return JSON.parse(raw) as T;
    } catch {
      return makeSeed();
    }
  }

  function write(): void {
    if (!canStore()) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // quota / private mode — the demo still works from memory
    }
  }

  function commit(next: T): T {
    value = next;
    write();
    for (const fn of listeners) {
      try {
        fn(value);
      } catch {
        // a listener must not break a handler
      }
    }
    return value;
  }

  return {
    storageKey,
    get: () => value,
    set: (next) => commit(typeof next === 'function' ? (next as (prev: T) => T)(value) : next),
    patch: (part) => commit({ ...(value as object), ...(part as object) } as T),
    reset: () => commit(makeSeed()),
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** A list store with the id-keyed helpers most mock modules need. */
export interface MockCollection<T extends { id: string | number }> extends MockDb<T[]> {
  find(id: T['id']): T | undefined;
  add(row: T): T;
  update(id: T['id'], part: Partial<T>): T | undefined;
  remove(id: T['id']): boolean;
}

export function createMockCollection<T extends { id: string | number }>(
  key: string,
  seed: T[] | (() => T[]),
): MockCollection<T> {
  const db = createMockDb<T[]>(key, seed);
  return {
    ...db,
    find: (id) => db.get().find((r) => r.id === id),
    add: (row) => {
      db.set((rows) => [...rows, row]);
      return row;
    },
    update: (id, part) => {
      let updated: T | undefined;
      db.set((rows) =>
        rows.map((r) => {
          if (r.id !== id) return r;
          updated = { ...r, ...part };
          return updated;
        }),
      );
      return updated;
    },
    remove: (id) => {
      const before = db.get().length;
      db.set((rows) => rows.filter((r) => r.id !== id));
      return db.get().length !== before;
    },
  };
}

/** Wipes every `ozio.mock.*` key — the "reset demo" action. */
export function resetAllMockDbs(): void {
  if (!canStore()) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k !== null && k.startsWith(PREFIX)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    // nothing to do
  }
}
