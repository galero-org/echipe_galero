import { expect, test } from "@playwright/test";

const testEmail = process.env.SUPABASE_TEST_EMAIL;
const testPassword = process.env.SUPABASE_TEST_PASSWORD;

function requireTestCredentials() {
  if (!testEmail || !testPassword) {
    throw new Error(
      "Integration auth tests require SUPABASE_TEST_EMAIL and SUPABASE_TEST_PASSWORD.",
    );
  }
}

test.describe("authenticated Supabase auth flows", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    requireTestCredentials();
  });

  test("logs in and reads the authenticated profile", async ({ page }) => {
    await page.goto("/signin");
    await page.locator('input[name="email"]').fill(testEmail!);
    await page.locator('input[name="password"]').fill(testPassword!);
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL(/\/profil$/);

    const cookies = await page.context().cookies();
    expect(cookies.some((cookie) => cookie.name === "sb-access-token")).toBe(
      true,
    );
    expect(cookies.some((cookie) => cookie.name === "sb-refresh-token")).toBe(
      true,
    );

    const profileResponse = await page.request.get("/api/get-profile");
    expect(profileResponse.status()).toBe(200);
    const profile = await profileResponse.json();
    expect(profile).toMatchObject({ id: expect.any(String) });
  });

  test("returns a safe redirect for invalid credentials", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/signin", {
      form: { email: testEmail!, password: `${testPassword!}-invalid` },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe(
      "/signin?error=invalid_credentials",
    );
  });

  test("allows an authenticated user to access protected pages", async ({
    page,
  }) => {
    await page.goto("/signin");
    await page.locator('input[name="email"]').fill(testEmail!);
    await page.locator('input[name="password"]').fill(testPassword!);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/profil$/);

    const playersResponse = await page.request.get("/players");
    expect(playersResponse.status()).toBe(200);
  });

  test("rejects player flag changes from a non-admin test user", async ({
    page,
  }) => {
    await page.goto("/signin");
    await page.locator('input[name="email"]').fill(testEmail!);
    await page.locator('input[name="password"]').fill(testPassword!);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/profil$/);

    const profileResponse = await page.request.get("/api/get-profile");
    expect(profileResponse.status()).toBe(200);
    const profile = await profileResponse.json();
    expect(profile.user_role).not.toBe("admin");

    const flagResponse = await page.request.post("/api/players/flag", {
      data: { playerId: "00000000-0000-0000-0000-000000000000", flagged: true },
      maxRedirects: 0,
    });
    expect(flagResponse.status()).toBe(403);
  });

  test("refreshes and then clears the authenticated session on logout", async ({
    page,
  }) => {
    await page.goto("/signin");
    await page.locator('input[name="email"]').fill(testEmail!);
    await page.locator('input[name="password"]').fill(testPassword!);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/profil$/);

    const refreshResponse = await page.request.post("/api/auth/refresh");
    expect(refreshResponse.status()).toBe(200);
    await expect(refreshResponse.json()).resolves.toMatchObject({ ok: true });

    const signOutResponse = await page.request.post("/api/auth/signout", {
      maxRedirects: 0,
    });
    expect(signOutResponse.status()).toBe(302);
    expect(signOutResponse.headers().location).toBe("/signin");

    await page.goto("/players");
    await expect(page).toHaveURL(/\/signin\?from=%2Fplayers$/);
  });
});
