import { expect, test } from '@playwright/test';

test('a versus-AI match runs from the title to the results and back', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Play vs AI' })).toBeVisible();
  await page.getByRole('button', { name: 'Play vs AI' }).click();
  await expect(page.getByText(/Build · wave 1/)).toBeVisible();
  const result = page.getByRole('heading', { name: /White wins|Black wins|Draw/ });
  await expect(result).toBeVisible();
  await page.getByRole('button', { name: 'Back to menu' }).click();
  await expect(page.getByRole('button', { name: 'Play vs AI' })).toBeVisible();
});
