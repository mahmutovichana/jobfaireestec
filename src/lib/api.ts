/** Same-origin client for the JobFAIR API. No hosted database or auth SDK. */
export interface User {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; avatar_url?: string };
  roles?: string[];
  board?: boolean;
  admin?: boolean;
}
export interface Session {
  user: User;
}
export interface ApiResult<T = any> {
  data: T;
  error: Error | null;
  count?: number;
}
const base = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");
async function request(
  url: string,
  options: RequestInit = {},
): Promise<ApiResult> {
  try {
    const response = await fetch(base + url, {
      ...options,
      credentials: "same-origin",
      headers: { "x-jobfair-request": "1", ...options.headers },
      signal: options.signal ?? AbortSignal.timeout(30000),
    });
    const result = await response.json();
    if (!response.ok)
      return {
        data: null,
        error: Object.assign(
          new Error(result.error?.message || "Zahtjev nije uspio"),
          { status: response.status },
        ),
      };
    return { ...result, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
function post(url: string, value: unknown) {
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}
class Query implements PromiseLike<ApiResult> {
  private query: any = { operation: "select", filters: [], order: [] };
  private pending?: Promise<ApiResult>;
  constructor(private table: string) {}
  select(columns = "*", options: any = {}) {
    this.query.columns = columns;
    Object.assign(this.query, options);
    return this;
  }
  insert(values: any) {
    this.query.operation = "insert";
    this.query.values = values;
    return this;
  }
  update(values: any) {
    this.query.operation = "update";
    this.query.values = values;
    return this;
  }
  upsert(values: any, options: any = {}) {
    this.query.operation = "upsert";
    this.query.values = values;
    Object.assign(this.query, options);
    return this;
  }
  delete() {
    this.query.operation = "delete";
    return this;
  }
  private filter(op: string, column: string, value: any) {
    this.query.filters.push({ op, column, value });
    return this;
  }
  eq(c: string, v: any) {
    return this.filter("eq", c, v);
  }
  neq(c: string, v: any) {
    return this.filter("neq", c, v);
  }
  gte(c: string, v: any) {
    return this.filter("gte", c, v);
  }
  lte(c: string, v: any) {
    return this.filter("lte", c, v);
  }
  ilike(c: string, v: any) {
    return this.filter("ilike", c, v);
  }
  in(c: string, v: any[]) {
    return this.filter("in", c, v);
  }
  is(c: string, v: any) {
    return this.filter("is", c, v);
  }
  order(column: string, { ascending = true }: any = {}) {
    this.query.order.push({ column, ascending });
    return this;
  }
  limit(limit: number) {
    this.query.limit = limit;
    return this;
  }
  range(start: number, end: number) {
    this.query.offset = start;
    this.query.limit = end - start + 1;
    return this;
  }
  single() {
    this.query.single = true;
    return this;
  }
  maybeSingle() {
    this.query.single = true;
    this.query.maybeSingle = true;
    return this;
  }
  then<TResult1 = ApiResult, TResult2 = never>(
    fulfilled?: ((value: ApiResult) => TResult1 | PromiseLike<TResult1>) | null,
    rejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    this.pending ??= (
      this.query.operation === "select"
        ? request(
            "/data/" +
              encodeURIComponent(this.table) +
              "?query=" +
              encodeURIComponent(JSON.stringify(this.query)),
          )
        : post("/data/" + encodeURIComponent(this.table), this.query)
    ).then((result) => {
      if (this.query.single && !result.error) {
        const rows = result.data ?? [];
        if (rows.length !== 1 && !(this.query.maybeSingle && rows.length === 0))
          return { data: null, error: new Error("Očekivan je jedan rezultat") };
        return { ...result, data: rows[0] ?? null };
      }
      return result;
    });
    return this.pending.then(fulfilled, rejected);
  }
}
const listeners = new Set<(event: string, session: Session | null) => void>();
let sessionRequest: Promise<ApiResult> | undefined;
const auth = {
  getSession() {
    sessionRequest ??= request("/auth/session")
      .then((r) => ({
        data: { session: r.data?.session ?? null },
        error: r.error,
      }))
      .finally(() => {
        sessionRequest = undefined;
      });
    return sessionRequest;
  },
  async getUser() {
    const r = await auth.getSession();
    return { data: { user: r.data?.session?.user ?? null }, error: r.error };
  },
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void,
  ) {
    listeners.add(callback);
    auth.getSession().then((r) => {
      if (listeners.has(callback))
        callback("INITIAL_SESSION", r.data?.session ?? null);
    });
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(callback);
          },
        },
      },
    };
  },
  async signOut() {
    const r = await post("/auth/logout", {});
    if (!r.error) listeners.forEach((fn) => fn("SIGNED_OUT", null));
    return r;
  },
};
const encodePath = (p: string) =>
  p.split("/").map(encodeURIComponent).join("/");
export const api = {
  from: (table: string) => new Query(table),
  rpc: (name: string, args: any) =>
    post("/rpc/" + encodeURIComponent(name), args),
  auth,
  functions: {
    invoke: (name: string, options: any = {}) =>
      post("/services/" + encodeURIComponent(name), options.body ?? {}),
  },
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: File, options: any = {}) =>
        request(
          "/storage/" +
            encodeURIComponent(bucket) +
            "?path=" +
            encodeURIComponent(path),
          {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          },
        ),
      getPublicUrl: (path: string) => ({
        data: {
          publicUrl:
            base +
            "/storage/public/" +
            encodeURIComponent(bucket) +
            "/" +
            encodePath(path),
        },
      }),
      createSignedUrl: (path: string, expiresIn: number) =>
        post("/storage/sign", { bucket, path, expiresIn }),
    }),
  },
};
