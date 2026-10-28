import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ server: vi.fn(), device: vi.fn() }));
vi.mock("@/utils/supabase/server", () => ({ createClient: mocks.server }));
vi.mock("@/utils/supabase/device", () => ({
  createDeviceClient: mocks.device,
}));
import { GET as deviceGet } from "@/app/api/device/route";
import { GET as scheduleGet, PUT } from "@/app/api/schedule/route";
import { POST as rotate } from "@/app/api/settings/route";

const token = "bcae50ef-0695-498f-8f22-471f9f6697ad";
const meal = { hour: 8, minute: 0, duration_sec: 10 };
const rpc = vi.fn();
const getUser = vi.fn();
const from = vi.fn();
const request = (body: unknown, origin = "https://feeder.example") =>
  new Request("https://feeder.example/api/schedule", {
    method: "PUT",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.resetAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "owner" } }, error: null });
  rpc.mockResolvedValue({ data: [meal], error: null });
  mocks.server.mockResolvedValue({ auth: { getUser }, rpc, from });
  mocks.device.mockReturnValue({ rpc });
});

describe("device API", () => {
  it("rejects absent or malformed credentials without contacting the database", async () => {
    for (const url of [
      "https://feeder.example/api/device",
      "https://feeder.example/api/device?token=secret",
    ]) {
      expect((await deviceGet(new Request(url))).status).toBe(401);
    }
    expect(rpc).not.toHaveBeenCalled();
  });
  it("uses bearer credentials in preference to a query token", async () => {
    const response = await deviceGet(
      new Request("https://feeder.example/api/device?token=ignored", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(rpc).toHaveBeenCalledWith("get_device_schedule", { p_token: token });
    expect(await response.json()).toEqual([meal]);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
  it("supports legacy query tokens and valid empty schedules", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    expect(
      await (
        await deviceGet(
          new Request(`https://feeder.example/api/device?token=${token}`),
        )
      ).json(),
    ).toEqual([]);
  });
  it.each([
    ["28000", 401],
    ["XX000", 503],
  ])("handles database error %s", async (code, status) => {
    rpc.mockResolvedValue({ data: null, error: { code } });
    expect(
      (
        await deviceGet(
          new Request(`https://feeder.example/api/device?token=${token}`),
        )
      ).status,
    ).toBe(status);
  });
  it("does not send malformed database data to hardware", async () => {
    rpc.mockResolvedValue({
      data: [{ ...meal, duration_sec: 999 }],
      error: null,
    });
    expect(
      (
        await deviceGet(
          new Request(`https://feeder.example/api/device?token=${token}`),
        )
      ).status,
    ).toBe(503);
  });
});

describe("schedule API", () => {
  it("requires a verified user for reads and writes", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await scheduleGet()).status).toBe(401);
    expect((await PUT(request([meal]))).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects cross-origin writes", async () => {
    expect(
      (await PUT(request([meal], "https://attacker.example"))).status,
    ).toBe(403);
    expect(mocks.server).not.toHaveBeenCalled();
  });
  it("rejects duplicate times before writing", async () => {
    expect((await PUT(request([meal, meal]))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("passes only validated meal fields to the atomic database operation", async () => {
    const response = await PUT(
      request([{ ...meal, user_id: "other-owner", id: 100 }]),
    );
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("replace_feed_schedule", {
      p_schedule: [meal],
    });
  });
  it("accepts deleting every meal", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    expect((await PUT(request([]))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("replace_feed_schedule", {
      p_schedule: [],
    });
  });
  it("rejects malformed JSON and oversized payloads", async () => {
    const make = (body: string) =>
      new Request("https://feeder.example/api/schedule", {
        method: "PUT",
        headers: { origin: "https://feeder.example" },
        body,
      });
    expect((await PUT(make("{"))).status).toBe(400);
    expect((await PUT(make(" ".repeat(4097)))).status).toBe(413);
  });
  it("returns a recoverable failure when the database is unavailable", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "XX000" } });
    expect((await PUT(request([meal]))).status).toBe(503);
  });
});

describe("token rotation", () => {
  it("requires the same origin and a verified account", async () => {
    expect(
      (
        await rotate(
          new Request("https://feeder.example/api/settings", {
            method: "POST",
          }),
        )
      ).status,
    ).toBe(403);
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(
      (
        await rotate(
          new Request("https://feeder.example/api/settings", {
            method: "POST",
            headers: { origin: "https://feeder.example" },
          }),
        )
      ).status,
    ).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("does not accept a caller-supplied owner", async () => {
    rpc.mockResolvedValue({ data: token, error: null });
    const response = await rotate(
      new Request("https://feeder.example/api/settings", {
        method: "POST",
        headers: { origin: "https://feeder.example" },
      }),
    );
    expect(await response.json()).toEqual({ device_token: token });
    expect(rpc).toHaveBeenCalledWith("rotate_device_token");
  });
});
