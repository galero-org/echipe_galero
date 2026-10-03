import { expect, test } from "@playwright/test";

test.describe("unauthenticated API guards", () => {
  test("redirects protected API reads to sign in", async ({ request }) => {
    const endpoints = [
      "/api/get-profile",
      "/api/players",
      "/api/confirmari?editionId=1",
      "/api/team-generations?edition_id=1",
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint, { maxRedirects: 0 });
      expect(response.status(), endpoint).toBe(302);
      expect(response.headers().location, endpoint).toContain("/signin");
    }
  });

  test("redirects protected API mutations to sign in", async ({ request }) => {
    const requests = [
      request.post("/api/players", {
        data: {},
        maxRedirects: 0,
      }),
      request.put("/api/players/test", {
        data: {},
        maxRedirects: 0,
      }),
      request.post("/api/players/flag", {
        data: {},
        maxRedirects: 0,
      }),
      request.post("/api/confirmari", {
        data: {},
        maxRedirects: 0,
      }),
    ];

    const responses = await Promise.all(requests);
    for (const response of responses) {
      expect(response.status()).toBe(302);
      expect(response.headers().location).toContain("/signin");
    }
  });

  test("rejects an OAuth callback without a code", async ({ request }) => {
    const response = await request.get("/api/auth/callback", {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(400);
    expect(await response.text()).toContain("No code provided");
  });

  test("supports both logout methods", async ({ request }) => {
    const getResponse = await request.get("/api/auth/signout", {
      maxRedirects: 0,
    });
    const postResponse = await request.post("/api/auth/signout", {
      maxRedirects: 0,
    });

    expect(getResponse.status()).toBe(302);
    expect(postResponse.status()).toBe(302);
    expect(getResponse.headers().location).toBe("/signin");
    expect(postResponse.headers().location).toBe("/signin");
  });
});
