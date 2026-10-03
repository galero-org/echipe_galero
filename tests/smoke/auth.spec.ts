import { expect, test } from "@playwright/test";

test.describe("authentication smoke flows", () => {
  test("shows the mobile menu trigger in the top-right corner", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile-only layout check");

    await page.goto("/signin");

    const menuButton = page.getByRole("button", {
      name: "Deschide meniul principal",
    });
    await expect(menuButton).toBeVisible();

    const box = await menuButton.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x + box!.width).toBeGreaterThan(viewport!.width - 24);
    expect(box!.y).toBeLessThan(100);

    await menuButton.click();
    await expect(page.locator("#mobile-menu")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Închide meniul principal" }),
    ).toBeVisible();
  });

  test("renders the sign-in form", async ({ page }) => {
    await page.goto("/signin");

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.locator('form[action="/api/auth/signin"]')).toHaveCount(
      2,
    );
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
    await expect(
      page.locator('form[action="/api/auth/signin"] button[name="provider"]'),
    ).toHaveAttribute("value", "google");
  });

  test("persists the selected color theme", async ({ page }) => {
    await page.goto("/signin");

    await page
      .getByRole("button", { name: "Deschide meniul principal" })
      .click();

    const themeButton = page.getByRole("button", {
      name: "Activează modul întunecat",
    });
    await expect(themeButton).toBeVisible();

    await themeButton.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(
      page.getByRole("button", { name: "Activează modul luminos" }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("galero-theme")))
      .toBe("dark");

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page
      .getByRole("button", { name: "Deschide meniul principal" })
      .click();
    await expect(
      page.getByRole("button", { name: "Activează modul luminos" }),
    ).toBeVisible();
  });

  test("renders the registration form", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
    await expect(
      page.locator('form[action="/api/auth/register"]'),
    ).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("rejects protected pages without a session", async ({ page }) => {
    await page.goto("/players");

    await expect(page).toHaveURL(/\/signin\?from=%2Fplayers$/);
  });

  test("rejects invalid sign-in and registration submissions", async ({
    request,
  }) => {
    const signInResponse = await request.post("/api/auth/signin", {
      form: {},
      maxRedirects: 0,
    });
    expect(signInResponse.status()).toBe(302);
    expect(signInResponse.headers().location).toBe(
      "/signin?error=missing_credentials",
    );

    const registerResponse = await request.post("/api/auth/register", {
      form: {},
      maxRedirects: 0,
    });
    expect(registerResponse.status()).toBe(302);
    expect(registerResponse.headers().location).toBe(
      "/register?error=missing_credentials",
    );
  });

  test("handles logout and refresh without a session", async ({ request }) => {
    const signOutResponse = await request.post("/api/auth/signout", {
      maxRedirects: 0,
    });
    expect(signOutResponse.status()).toBe(302);
    expect(signOutResponse.headers().location).toBe("/signin");

    const refreshResponse = await request.post("/api/auth/refresh", {
      maxRedirects: 0,
    });
    expect(refreshResponse.status()).toBe(401);
  });
});
