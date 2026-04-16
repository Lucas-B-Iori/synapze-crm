import { test, expect } from "@playwright/test";

test("homepage redirects to dashboard or login", async ({ page }) => {
  await page.goto("/");
  // Sem autenticação, deve redirecionar para /auth/login
  await expect(page).toHaveURL(/.*auth\/login/);
});

test("login page has title and form", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page).toHaveTitle(/Synapze CRM/);
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole("button", { name: /Entrar com Email/i })).toBeVisible();
});

test("forbidden page renders correctly", async ({ page }) => {
  await page.goto("/forbidden");
  await expect(page.locator("text=403")).toBeVisible();
  await expect(page.locator("text=Voltar ao Dashboard")).toBeVisible();
});
