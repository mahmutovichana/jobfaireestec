import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { api } from "@/lib/api";
const fetchMock = vi.fn();
const response = (body: any, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());
describe("independent API contract", () => {
  it("keeps selection, filters, order and pagination on the same origin", async () => {
    fetchMock.mockImplementation(() =>
      response({ data: [{ id: "one" }], error: null }),
    );
    const result = await api
      .from("events")
      .select("id,name")
      .eq("status", "live")
      .order("created_at", { ascending: false })
      .range(20, 29);
    const [url, options] = fetchMock.mock.calls[0];
    const query = JSON.parse(
      new URL(url, "http://localhost").searchParams.get("query")!,
    );
    expect(url).toMatch(/^\/api\/v1\/data\/events/);
    expect(options.credentials).toBe("same-origin");
    expect(query.filters).toEqual([
      { op: "eq", column: "status", value: "live" },
    ]);
    expect(query.limit).toBe(10);
    expect(query.offset).toBe(20);
    expect(result.data[0].id).toBe("one");
  });
  it("executes a mutation once even when the result is awaited twice", async () => {
    fetchMock.mockImplementation(() =>
      response({ data: [{ id: "new" }], error: null }),
    );
    const query = api
      .from("events")
      .insert({ name: "Example" })
      .select()
      .single();
    expect((await query).data.id).toBe("new");
    expect((await query).data.id).toBe("new");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].headers["x-jobfair-request"]).toBe("1");
  });
  it("preserves nullable single-result behavior", async () => {
    fetchMock.mockImplementation(() => response({ data: [], error: null }));
    expect((await api.from("profiles").select().maybeSingle()).data).toBeNull();
    expect((await api.from("profiles").select().single()).error).toBeInstanceOf(
      Error,
    );
  });
  it("provides a safe empty session when authentication is unavailable", async () => {
    fetchMock.mockImplementation(() =>
      response({ error: { message: "Unavailable" } }, 503),
    );
    const result = await api.auth.getSession();
    expect(result.data.session).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });
  it("does not turn network failures into successful writes", async () => {
    fetchMock.mockRejectedValue(new TypeError("offline"));
    const result = await api.from("cv_submissions").insert({});
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });
});
