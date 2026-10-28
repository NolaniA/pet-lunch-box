import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
let db: PGlite;
let token: string;
const meal = { hour: 8, minute: 0, duration_sec: 10 };

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  await db.exec(
    readFileSync(
      new URL(
        "../supabase/migrations/202610280001_initial_schema.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.query("insert into auth.users(id) values ($1),($2)", [owner, other]);
  const result = await db.query<{ device_token: string }>(
    "select device_token from public.user_data where user_id=$1",
    [owner],
  );
  token = result.rows[0].device_token;
}, 30000);
afterAll(async () => {
  await db?.close();
});

async function asUser(id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec("set role authenticated");
}
async function save(schedule: unknown) {
  return db.query<{ result: unknown }>(
    "select public.replace_feed_schedule($1::jsonb) as result",
    [JSON.stringify(schedule)],
  );
}

describe("real PostgreSQL schema and permissions", () => {
  it("provisions each account and isolates rows using RLS", async () => {
    await asUser(owner);
    const result = await db.query<{ user_id: string }>(
      "select user_id from public.user_data",
    );
    expect(result.rows).toEqual([{ user_id: owner }]);
  });
  it("forbids direct writes that could bypass the meal limit", async () => {
    await asUser(owner);
    await expect(
      db.query(
        "insert into public.feed_schedule(user_id,hour,minute,duration_sec) values ($1,8,0,10)",
        [owner],
      ),
    ).rejects.toThrow(/permission denied/);
  });
  it("replaces schedules atomically and ignores supplied owner fields", async () => {
    await asUser(owner);
    await save([{ ...meal, user_id: other }]);
    expect(
      (await db.query("select user_id from public.feed_schedule")).rows,
    ).toEqual([{ user_id: owner }]);
    await expect(save([meal, meal])).rejects.toThrow(/Duplicate/);
    expect(
      (await db.query("select hour from public.feed_schedule")).rows,
    ).toEqual([{ hour: 8 }]);
  });
  it.each([
    [{ ...meal, duration_sec: 61 }],
    [{ ...meal, hour: 1.5 }],
    [{ ...meal, hour: "8" }],
    [{ minute: 1 }],
    Array.from({ length: 11 }, (_, minute) => ({ ...meal, minute })),
  ])("also enforces validation for direct RPC clients %#", async (...rows) => {
    await asUser(owner);
    await expect(save(rows)).rejects.toThrow();
  });
  it("accepts an empty schedule and exposes only meal fields to a device", async () => {
    await asUser(owner);
    await save([meal]);
    await db.exec("reset role; set role anon");
    const result = await db.query<{ result: unknown }>(
      "select public.get_device_schedule($1) as result",
      [token],
    );
    expect(result.rows[0].result).toEqual([meal]);
    await expect(db.query("select * from public.user_data")).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      db.query("select public.replace_feed_schedule('[]')"),
    ).rejects.toThrow(/permission denied/);
    await asUser(owner);
    await save([]);
    await db.exec("reset role; set role anon");
    expect(
      (
        await db.query<{ result: unknown }>(
          "select public.get_device_schedule($1) as result",
          [token],
        )
      ).rows[0].result,
    ).toEqual([]);
  });
  it("does not expose another account’s schedule", async () => {
    await asUser(other);
    await save([{ ...meal, hour: 18 }]);
    await asUser(owner);
    expect((await db.query("select * from public.feed_schedule")).rows).toEqual(
      [],
    );
  });
  it("invalidates the old token immediately after rotation", async () => {
    await asUser(owner);
    const rotated = await db.query<{ token: string }>(
      "select public.rotate_device_token() as token",
    );
    expect(rotated.rows[0].token).not.toBe(token);
    await db.exec("reset role; set role anon");
    await expect(
      db.query("select public.get_device_schedule($1)", [token]),
    ).rejects.toThrow(/Invalid device token/);
    await expect(
      db.query("select public.rotate_device_token()"),
    ).rejects.toThrow(/permission denied/);
  });
});
