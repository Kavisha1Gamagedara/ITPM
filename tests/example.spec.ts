import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Load test cases from the CSV file (place test-cases.csv in the same folder as this spec)
// The first few lines of the sheet are notes, so start from the header row.
const rawRecords = parse(
  fs.readFileSync(path.join(__dirname, 'test-cases.csv')),
  {
    columns: true,
    skip_empty_lines: true,
    from_line: 5, // row where "TC ID,Test case name,..." header starts
  }
);

// Keep only real test case rows that have both TC ID and Input defined
const records = (rawRecords as any[]).filter(
  (r) => r['TC ID'] && r['Input']
);

test.describe('SLIIT Transliteration Assignment Tests', () => {
  records.forEach((record: any, index: number) => {
    const tcId = record['TC ID'] as string;
    const testName = (record['Test case name'] as string) || 'Unnamed test case';

    test(`${tcId} - ${testName}`, async ({ page }) => {
      await page.goto('https://www.swifttranslator.com/');

      // Left area: Singlish input textbox
      const inputLocator = page.getByRole('textbox', { name: /Input Your Singlish Text Here\./i });

      await inputLocator.waitFor({ state: 'visible', timeout: 10000 });
      await inputLocator.fill(record['Input']);

      // Give the site a moment to perform the transliteration
      await page.waitForTimeout(1000);

      const expectedOutput = record['Expected output'] as string;

      if (tcId.startsWith('Pos_Fun')) {
        // For positive cases, just assert the expected Sinhala text appears somewhere on the page
        await expect(page.locator('body')).toContainText(expectedOutput);
      }
    });
  });

  test('Pos_UI_0001: Output updates automatically in real-time', async ({ page }) => {
    await page.goto('https://www.swifttranslator.com/');

    const inputLocator = page.getByRole('textbox', { name: /Input Your Singlish Text Here\./i });

    await inputLocator.waitFor({ state: 'visible', timeout: 10000 });

    await inputLocator.type('ma');
    await expect(page.locator('body')).toContainText(/ම/);

    await inputLocator.type('ma');
    await expect(page.locator('body')).toContainText(/මම/);
  });
});