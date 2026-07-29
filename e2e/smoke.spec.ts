import { expect, test } from '@playwright/test';

test('send an email end-to-end through the mock provider', async ({ page }) => {
  const recipient = `e2e-${Date.now()}@example.com`;
  const subject = `Playwright smoke test ${Date.now()}`;

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

  await page.getByRole('link', { name: /send email/i }).click();
  await expect(page).toHaveURL(/\/emails\/new$/);

  await page.getByLabel(/^to$/i).fill(recipient);
  await page.getByLabel(/subject/i).fill(subject);
  await page.getByLabel(/html body/i).fill('<p>Hello from Playwright</p>');
  await page.getByRole('button', { name: /send email/i }).click();

  // The send form navigates straight to the new email's details page.
  await expect(page).toHaveURL(/\/emails\/[^/]+$/, { timeout: 10_000 });
  const emailUrl = page.url();

  await page.goto('/emails');
  const row = page.locator('[role="row"]').filter({ hasText: recipient });
  await expect(row).toBeVisible();
  await row.getByRole('link', { name: /view/i }).click();

  await expect(page).toHaveURL(emailUrl);
  await expect(page.getByRole('heading', { name: subject })).toBeVisible();

  // The mock provider resolves synchronously once the local queue consumer
  // picks the job up, so this should settle within a couple of poll cycles.
  await expect(page.getByText('Delivered', { exact: true })).toBeVisible({ timeout: 15_000 });

  await expect(page.getByText('processing', { exact: true })).toBeVisible();
  await expect(page.getByText('delivered', { exact: true })).toBeVisible();
});
