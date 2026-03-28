// Cloudflare Worker types and interfaces
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(
      queries: (D1PreparedStatement | string)[]
    ): Promise<D1Result<T>[]>;
    exec<T = unknown>(query: string): Promise<D1Result<T>>;
    dump(): Promise<ArrayBuffer>;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | undefined>;
    run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
    all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
  }

  interface D1Result<T = Record<string, unknown>> {
    success: boolean;
    results: T[];
    meta: {
      duration: number;
      last_row_id: number | null;
      changes: number | null;
      served_by: string;
      internal_stats: string;
    };
  }

  interface R2Bucket {
    head(key: string): Promise<R2Object | null>;
    get(key: string): Promise<R2ObjectBody | null>;
    put(key: string, value: ReadableStream | ArrayBuffer | string, options?: Record<string, unknown>): Promise<R2Object>;
    delete(keys: string | string[]): Promise<void>;
    list(options?: Record<string, unknown>): Promise<R2Objects>;
  }

  interface R2Object {
    key: string;
    version: string;
    size: number;
    etag: string;
    httpEtag: string;
    storageClass: string;
    uploaded: Date;
    customMetadata?: Record<string, string>;
  }

  interface R2ObjectBody extends R2Object {
    body: ReadableStream<Uint8Array>;
    bodyUsed: boolean;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json(): Promise<unknown>;
    blob(): Promise<Blob>;
  }

  interface R2Objects {
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
    delimitedPrefixes?: string[];
  }

  interface DurableObjectNamespace {
    get(id: string | DurableObjectId): DurableObjectStub;
    idFromName(name: string): DurableObjectId;
    idFromString(id: string): DurableObjectId;
    newUniqueId(): DurableObjectId;
  }

  interface DurableObjectId {
    toString(): string;
    toJSON(): string;
    equals(other: DurableObjectId): boolean;
  }

  interface DurableObjectStub {
    fetch(request: Request | string, options?: RequestInit): Promise<Response>;
    alarm(options?: { allowConcurrency?: boolean }): Promise<void>;
    getAlarm(): Promise<number | null>;
    deleteAlarm(): Promise<void>;
  }

  interface DurableObjectState {
    id: DurableObjectId;
    storage: DurableObjectStorage;
    blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
    acceptWebSocket(ws: WebSocket): void;
    getWebSockets(tag?: string): WebSocket[];
    setWebSocketAutoResponse(auto: ArrayBuffer | string | null): void;
  }

  interface DurableObjectStorage {
    get<T = unknown>(key: string, options?: { allowConcurrency?: boolean }): Promise<T | undefined>;
    put<T = unknown>(key: string, value: T, options?: { allowConcurrency?: boolean }): Promise<void>;
    delete(key: string, options?: { allowConcurrency?: boolean }): Promise<boolean>;
    list<T = unknown>(options?: { prefix?: string; limit?: number; allowConcurrency?: boolean }): Promise<Map<string, T>>;
  }
}

export {};