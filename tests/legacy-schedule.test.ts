import { PGlite } from "@electric-sql/pglite";
import { createClient } from "@supabase/supabase-js";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({ server: vi.fn() }));
vi.mock("@/utils/supabase/server", () => ({ createClient: mocks.server }));
import { PUT } from "@/app/api/schedule/route";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const oldIds = [
  "10000000-0000-4000-8000-000000000001",
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
];
const otherId = "20000000-0000-4000-8000-000000000001";
const initial = [
  { hour: 6, minute: 0, duration_sec: 10 },
  { hour: 11, minute: 30, duration_sec: 10 },
  { hour: 17, minute: 0, duration_sec: 10 },
];
interface StoredRow {
  id: string;
  user_id: string;
  hour: number;
  minute: number;
  duration_sec: number;
}
type RecordedRequest = {
  method: string;
  url: URL;
  body?: Record<string, unknown>[];
  prefer: string;
};
let db: PGlite;
let requests: RecordedRequest[] = [];
let failWrite = false;
let ignoreDelete = false;
const rpc = vi.fn();
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

async function assumeOwner() {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
    owner,
  ]);
  await db.exec("set role authenticated");
}

// A small PostgREST test transport backed by real PostgreSQL. The production
// helper uses the actual Supabase client; requests here never leave the process.
const restFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  const body =
    request.method === "POST"
      ? ((await request.json()) as Record<string, unknown>[])
      : undefined;
  const prefer = request.headers.get("prefer") ?? "";
  requests.push({ method: request.method, url, body, prefer });
  try {
    if (url.pathname !== "/rest/v1/feed_schedule")
      throw new Error("Unexpected test endpoint.");
    const ownerFilter = url.searchParams.get("user_id");
    const selected = (url.searchParams.get("select") ?? "id")
      .split(",")
      .map((column) => column.trim());
    if (
      !selected.every((column) =>
        ["id", "user_id", "hour", "minute", "duration_sec"].includes(column),
      )
    ) {
      throw new Error("Unexpected selected columns.");
    }
    if (request.method === "GET") {
      if (!ownerFilter?.startsWith("eq."))
        throw new Error("Missing account filter.");
      const result = await db.query(
        `select ${selected.join(",")} from feed_schedule where user_id=$1 order by hour,minute`,
        [ownerFilter.slice(3)],
      );
      return Response.json(result.rows);
    }
    if (request.method === "POST") {
      if (failWrite)
        return Response.json(
          { code: "XX000", message: "Test write failure" },
          { status: 503 },
        );
      if (!body?.length) throw new Error("Expected a meal batch.");
      const params: unknown[] = [];
      const values = body.map((row) => {
        const bind = (value: unknown) => {
          params.push(value);
          return "$" + params.length;
        };
        const id =
          "id" in row
            ? bind(row.id)
            : prefer.includes("missing=default")
              ? "DEFAULT"
              : bind(null);
        return `(${id},${bind(row.user_id)},${bind(row.hour)},${bind(row.minute)},${bind(row.duration_sec)})`;
      });
      const result = await db.query(
        `insert into feed_schedule(id,user_id,hour,minute,duration_sec) values ${values.join(",")}
        on conflict(id) do update set user_id=excluded.user_id,hour=excluded.hour,minute=excluded.minute,duration_sec=excluded.duration_sec
        returning ${selected.join(",")}`,
        params,
      );
      return Response.json(result.rows, { status: 201 });
    }
    if (request.method === "DELETE") {
      if (!ownerFilter?.startsWith("eq."))
        throw new Error("Missing account filter.");
      const idFilter = url.searchParams.get("id");
      if (!idFilter?.startsWith("in.(")) throw new Error("Missing row filter.");
      const ids = idFilter
        .slice(4, -1)
        .split(",")
        .map((id) => id.replaceAll('"', ""));
      if (!ignoreDelete)
        await db.query(
          "delete from feed_schedule where user_id=$1 and id=any($2::uuid[])",
          [ownerFilter.slice(3), ids],
        );
      return new Response(null, { status: 204 });
    }
    throw new Error("Unexpected test method.");
  } catch (error) {
    const failure = error as { code?: string; message?: string };
    return Response.json(
      { code: failure.code ?? "TEST_ERROR", message: failure.message },
      { status: 400 },
    );
  }
};

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to authenticated;
    create table feed_schedule(
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      hour integer not null check(hour between 0 and 23),
      minute integer not null check(minute between 0 and 59),
      duration_sec integer not null check(duration_sec between 0 and 60),
      unique(user_id,hour,minute)
    );
    alter table feed_schedule enable row level security;
    grant select,insert,update,delete on feed_schedule to authenticated;
    create policy own_meals on feed_schedule to authenticated
      using(user_id=auth.uid()) with check(user_id=auth.uid());
  `);
}, 30000);
afterAll(async () => {
  consoleError.mockRestore();
  await db?.close();
});

beforeEach(async () => {
  await db.exec("reset role; truncate feed_schedule");
  for (let i = 0; i < initial.length; i++) {
    await db.query("insert into feed_schedule values($1,$2,$3,$4,$5)", [
      oldIds[i],
      owner,
      initial[i].hour,
      initial[i].minute,
      initial[i].duration_sec,
    ]);
  }
  await db.query("insert into feed_schedule values($1,$2,22,0,15)", [
    otherId,
    other,
  ]);
  await assumeOwner();
  requests = [];
  failWrite = false;
  ignoreDelete = false;
  rpc
    .mockReset()
    .mockResolvedValue({ data: null, error: { code: "PGRST202" } });
  const client = createClient(
    "https://legacy-schedule.example",
    "test-anon-key",
    {
      global: { fetch: restFetch },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  mocks.server.mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user: { id: owner } }, error: null }),
    },
    rpc,
    from: client.from.bind(client),
  });
});

const save = (value: unknown) =>
  PUT(
    new Request("https://feeder.example/api/schedule", {
      method: "PUT",
      headers: {
        origin: "https://feeder.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(value),
    }),
  );
async function rowsFor(userId: string) {
  await db.exec("reset role");
  const result = await db.query<StoredRow>(
    "select id,user_id,hour,minute,duration_sec from feed_schedule where user_id=$1 order by hour,minute",
    [userId],
  );
  await assumeOwner();
  return result.rows;
}

describe("saving on an existing database without the new RPC", () => {
  it("saves the three meals from the reported screen without clearing any rows first", async () => {
    const desired = initial.map((meal) => ({ ...meal, duration_sec: 5 }));
    const response = await save(desired);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(desired);
    expect(requests.map((request) => request.method)).toEqual([
      "GET",
      "POST",
      "GET",
    ]);
    expect((await rowsFor(owner)).map((row) => row.duration_sec)).toEqual([
      5, 5, 5,
    ]);
    expect(await rowsFor(other)).toHaveLength(1);
  });
  it("reserves existing times before reusing IDs, so a unique time constraint does not collide", async () => {
    const desired = [
      { hour: 7, minute: 0, duration_sec: 5 },
      { hour: 17, minute: 0, duration_sec: 5 },
      { hour: 20, minute: 0, duration_sec: 5 },
    ];
    expect((await save(desired)).status).toBe(200);
    const saved = await rowsFor(owner);
    expect(saved.find((row) => row.hour === 17)?.id).toBe(oldIds[2]);
  });
  it("adds a new meal with its database-generated ID in the same batch as existing rows", async () => {
    const response = await save([
      ...initial,
      { hour: 20, minute: 0, duration_sec: 5 },
    ]);
    expect(response.status).toBe(200);
    const write = requests.find((request) => request.method === "POST")!;
    expect(write.prefer).toContain("missing=default");
    expect(write.body?.at(-1)).not.toHaveProperty("id");
    expect(await rowsFor(owner)).toHaveLength(4);
  });
  it("removes only the account's omitted row IDs after a successful write", async () => {
    const response = await save([initial[0]]);
    expect(response.status).toBe(200);
    expect(requests.map((request) => request.method)).toEqual([
      "GET",
      "POST",
      "DELETE",
      "GET",
    ]);
    const deletion = requests.find((request) => request.method === "DELETE")!;
    expect(deletion.url.searchParams.get("user_id")).toBe("eq." + owner);
    expect(deletion.url.searchParams.get("id")).not.toContain(otherId);
    expect(await rowsFor(owner)).toHaveLength(1);
    expect(await rowsFor(other)).toHaveLength(1);
  });
  it("pauses all meals with an empty schedule while preserving another account", async () => {
    const response = await save([]);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(requests.some((request) => request.method === "POST")).toBe(false);
    expect(await rowsFor(owner)).toHaveLength(0);
    expect(await rowsFor(other)).toHaveLength(1);
  });
  it("never deletes previous meals if the upsert fails", async () => {
    failWrite = true;
    expect(await save([initial[0]])).toHaveProperty("status", 503);
    expect(requests.some((request) => request.method === "DELETE")).toBe(false);
    expect((await rowsFor(owner)).map((row) => row.id)).toEqual(oldIds);
    expect(await rowsFor(other)).toHaveLength(1);
  });
  it("does not claim success when RLS silently prevents removing a meal", async () => {
    ignoreDelete = true;
    expect((await save([initial[0]])).status).toBe(503);
    expect(await rowsFor(owner)).toHaveLength(3);
  });
  it("ignores caller-supplied ownership and foreign row IDs", async () => {
    const response = await save([
      { ...initial[0], id: otherId, user_id: other },
    ]);
    expect(response.status).toBe(200);
    expect(
      requests.find((request) => request.method === "POST")?.body?.[0],
    ).toMatchObject({ id: oldIds[0], user_id: owner });
    expect(await rowsFor(other)).toMatchObject([
      { id: otherId, user_id: other, hour: 22, duration_sec: 15 },
    ]);
  });
  it("does not bypass a database permission or availability error with the legacy path", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501" } });
    expect((await save(initial)).status).toBe(503);
    expect(requests).toEqual([]);
    expect(await rowsFor(owner)).toHaveLength(3);
  });
});
