const express = require("express");
const request = require("supertest");
const errorHandler = require("../../../middleware/errorHandler");

const GENERIC_500 = "Internal server error";

const buildApp = () => {
  const app = express();
  app.use(express.json());

  app.get("/db-error", () => {
    const e = new Error(
      "MongoServerError: E11000 duplicate key error collection: careline.users index: email_1 dup key",
    );
    e.name = "MongoServerError";
    throw e;
  });

  app.get("/leaky-path", () => {
    throw new Error(
      "ENOENT: no such file or directory, open '/var/www/careline/server/secret.key'",
    );
  });

  app.get("/generic", () => {
    throw new Error("Something exploded with internal detail xyz");
  });

  app.get("/bad-input", () => {
    const e = new Error("Invalid user id");
    e.statusCode = 400; // real 4xx business error - message is allowed
    throw e;
  });

  app.use(errorHandler);
  return app;
};

let app;
const leakMarkers = [
  /MongoServerError/i,
  /E11000/i,
  /ENOENT/i,
  /\/var\/www/i,
  /secret\.key/i,
  /exploded/i,
  /internal detail/i,
  /at .*\(.*:\d+:\d+\)/, // stack frame
];

beforeAll(() => {
  app = buildApp();
});

describe("Member 2 - V5 Error Information Leakage", () => {
  test("500 from a DB error does not leak the driver message", async () => {
    const res = await request(app).get("/db-error").expect(500);
    const body = JSON.stringify(res.body);
    leakMarkers.forEach((re) => expect(body).not.toMatch(re));
    expect(res.body.message).toBe(GENERIC_500);
  });

  test("500 does not leak a filesystem path", async () => {
    const res = await request(app).get("/leaky-path").expect(500);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/\/var\/www/i);
    expect(body).not.toMatch(/secret\.key/i);
    expect(res.body.message).toBe(GENERIC_500);
  });

  test("500 returns a fixed generic message, not the thrown text", async () => {
    const res = await request(app).get("/generic").expect(500);
    expect(res.body.message).toBe(GENERIC_500);
    expect(res.body.message).not.toMatch(/exploded/i);
  });

  test("no response body exposes a stack trace", async () => {
    for (const path of ["/db-error", "/leaky-path", "/generic"]) {
      const res = await request(app).get(path);
      expect(JSON.stringify(res.body)).not.toMatch(/at .*\(.*:\d+:\d+\)/);
      expect(res.body).not.toHaveProperty("stack");
    }
  });

  test("intentional 4xx business errors still return their own message", async () => {
    const res = await request(app).get("/bad-input").expect(400);
    expect(res.body.message).toBe("Invalid user id");
  });

  test("known mapped errors keep their friendly messages", async () => {
    const app2 = express();
    app2.get("/cast", () => {
      const e = new Error("cast fail");
      e.name = "CastError";
      e.path = "id";
      throw e;
    });
    app2.use(errorHandler);
    const res = await request(app2).get("/cast").expect(400);
    expect(res.body.message).toMatch(/Invalid id format/i);
  });
});
