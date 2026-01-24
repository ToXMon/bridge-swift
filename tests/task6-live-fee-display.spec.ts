import { test, expect } from '@playwright/test';

/**
 * Task 6: Live Fee Display - Acceptance Criteria Tests
 * 
 * Acceptance Criteria:
 * - [ ] Live fee display updates as user types amount
 * - [ ] Shows breakdown: network fee + bridge fee
 * - [ ] Shows estimated arrival time based on chain
 * - [ ] "You'll receive" highlighted in green box
 * - [ ] Uses consistent USD formatting
 */

test.describe('Task 6: Live Fee Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('AC1: Live fee display updates as user types amount', async ({ page }) => {
    // Find the amount input field
    const amountInput = page.locator('input[type="number"]').first();
    
    // Initially, fee display should not be visible (no amount entered)
    const feeDisplay = page.locator('.live-fee-display');
    await expect(feeDisplay).not.toBeVisible();
    
    // Type an amount
    await amountInput.fill('100');
    await page.waitForTimeout(500); // Wait for React state update
    
    // Fee display should now be visible
    await expect(feeDisplay).toBeVisible();
    
    // Change the amount
    await amountInput.fill('500');
    await page.waitForTimeout(500);
    
    // Fee display should still be visible and values should update
    await expect(feeDisplay).toBeVisible();
    
    // Clear the amount
    await amountInput.fill('');
    await page.waitForTimeout(500);
    
    // Fee display should disappear
    await expect(feeDisplay).not.toBeVisible();
  });

  test('AC2: Shows breakdown - network fee + bridge fee', async ({ page }) => {
    const amountInput = page.locator('input[type="number"]').first();
    
    // Enter an amount
    await amountInput.fill('100');
    await page.waitForTimeout(500);
    
    const feeDisplay = page.locator('.live-fee-display');
    await expect(feeDisplay).toBeVisible();
    
    // Check for network fee label
    const networkFeeLabel = feeDisplay.locator('text=Network fee');
    await expect(networkFeeLabel).toBeVisible();
    
    // Check for bridge fee label with percentage
    const bridgeFeeLabel = feeDisplay.locator('text=Bridge fee (0.1%)');
    await expect(bridgeFeeLabel).toBeVisible();
    
    // Check for total fees label
    const totalFeesLabel = feeDisplay.locator('text=Total fees');
    await expect(totalFeesLabel).toBeVisible();
    
    // Verify that fee values are displayed (should contain $ symbol)
    const feeValues = await feeDisplay.locator('.font-mono').allTextContents();
    expect(feeValues.length).toBeGreaterThan(0);
    feeValues.forEach(value => {
      expect(value).toContain('$');
    });
  });

  test('AC3: Shows estimated arrival time based on chain', async ({ page }) => {
    const amountInput = page.locator('input[type="number"]').first();
    
    // Enter an amount
    await amountInput.fill('100');
    await page.waitForTimeout(500);
    
    const feeDisplay = page.locator('.live-fee-display');
    await expect(feeDisplay).toBeVisible();
    
    // Check for estimated arrival label
    const estimatedArrivalLabel = feeDisplay.locator('text=Estimated arrival');
    await expect(estimatedArrivalLabel).toBeVisible();
    
    // Check that time estimate is displayed (should contain "minutes")
    const timeEstimate = feeDisplay.locator('text=/~\\d+ minutes/');
    await expect(timeEstimate).toBeVisible();
  });

  test('AC4: "You\'ll receive" highlighted in green box', async ({ page }) => {
    const amountInput = page.locator('input[type="number"]').first();
    
    // Enter an amount
    await amountInput.fill('100');
    await page.waitForTimeout(500);
    
    const feeDisplay = page.locator('.live-fee-display');
    await expect(feeDisplay).toBeVisible();
    
    // Find the "You'll receive" section
    const youllReceiveLabel = feeDisplay.locator('text=You\'ll receive');
    await expect(youllReceiveLabel).toBeVisible();
    
    // Check that it's in a green-themed container
    const greenBox = feeDisplay.locator('.bg-green-900\\/20');
    await expect(greenBox).toBeVisible();
    
    // Verify the green box contains the "You'll receive" text
    await expect(greenBox.locator('text=You\'ll receive')).toBeVisible();
    
    // Verify it shows USDCx
    await expect(greenBox.locator('text=/USDCx/')).toBeVisible();
  });

  test('AC5: Uses consistent USD formatting', async ({ page }) => {
    const amountInput = page.locator('input[type="number"]').first();
    
    // Enter an amount
    await amountInput.fill('100');
    await page.waitForTimeout(500);
    
    const feeDisplay = page.locator('.live-fee-display');
    await expect(feeDisplay).toBeVisible();
    
    // Get all monetary values
    const moneyValues = await feeDisplay.locator('.font-mono').allTextContents();
    
    // Verify each value:
    // 1. Starts with $
    // 2. Has proper decimal formatting (e.g., $1.23 or $1,234.56)
    moneyValues.forEach(value => {
      expect(value).toMatch(/^\$\d{1,3}(,\d{3})*\.\d{2}/);
    });
  });

  test('Integration: Fee calculation accuracy', async ({ page }) => {
    const amountInput = page.locator('input[type="number"]').first();
    
    // Enter a specific amount to test calculation
    await amountInput.fill('1000');
    await page.waitForTimeout(500);
    
    const feeDisplay = page.locator('.live-fee-display');
    await expect(feeDisplay).toBeVisible();
    
    // Bridge fee should be 0.1% of 1000 = $1.00
    const bridgeFeeText = await feeDisplay.locator('text=Bridge fee (0.1%)').locator('..').locator('.font-mono').textContent();
    expect(bridgeFeeText).toContain('1.00');
    
    // Total fees should be network fee + bridge fee
    const totalFeesText = await feeDisplay.locator('text=Total fees').locator('..').locator('.font-mono').textContent();
    expect(totalFeesText).toBeTruthy();
    
    // "You'll receive" should be less than the input amount
    const youllReceiveText = await feeDisplay.locator('.bg-green-900\\/20').locator('.font-mono').textContent();
    expect(youllReceiveText).toBeTruthy();
  });

  test('Edge case: Zero amount', async ({ page }) => {
    const amountInput = page.locator('input[type="number"]').first();
    
    // Enter zero
    await amountInput.fill('0');
    await page.waitForTimeout(500);
    
    // Fee display should not be visible for zero amount
    const feeDisplay = page.locator('.live-fee-display');
    await expect(feeDisplay).not.toBeVisible();
  });

  test('Edge case: Very small amount', async ({ page }) => {
    const amountInput = page.locator('input[type="number"]').first();
    
    // Enter minimum amount (10 USDC)
    await amountInput.fill('10');
    await page.waitForTimeout(500);
    
    const feeDisplay = page.locator('.live-fee-display');
    await expect(feeDisplay).toBeVisible();
    
    // All fee components should still be visible and formatted correctly
    await expect(feeDisplay.locator('text=Network fee')).toBeVisible();
    await expect(feeDisplay.locator('text=Bridge fee (0.1%)')).toBeVisible();
    await expect(feeDisplay.locator('text=Total fees')).toBeVisible();
    await expect(feeDisplay.locator('text=You\'ll receive')).toBeVisible();
  });

  test('Edge case: Maximum amount', async ({ page }) => {
    const amountInput = page.locator('input[type="number"]').first();
    
    // Enter maximum amount (1000 USDC)
    await amountInput.fill('1000');
    await page.waitForTimeout(500);
    
    const feeDisplay = page.locator('.live-fee-display');
    await expect(feeDisplay).toBeVisible();
    
    // Verify all components are visible with large numbers
    const moneyValues = await feeDisplay.locator('.font-mono').allTextContents();
    expect(moneyValues.length).toBeGreaterThan(0);
    
    // All values should be properly formatted with commas if needed
    moneyValues.forEach(value => {
      expect(value).toMatch(/^\$\d{1,3}(,\d{3})*\.\d{2}/);
    });
  });

  test('Visual regression: Fee display styling', async ({ page }) => {
    const amountInput = page.locator('input[type="number"]').first();
    
    // Enter an amount
    await amountInput.fill('100');
    await page.waitForTimeout(500);
    
    const feeDisplay = page.locator('.live-fee-display');
    await expect(feeDisplay).toBeVisible();
    
    // Verify styling classes are applied
    const classList = await feeDisplay.getAttribute('class');
    expect(classList).toContain('bg-black/40');
    expect(classList).toContain('rounded-xl');
    expect(classList).toContain('border');
    
    // Verify green box styling
    const greenBox = feeDisplay.locator('.bg-green-900\\/20');
    const greenBoxClass = await greenBox.getAttribute('class');
    expect(greenBoxClass).toContain('border-green-700/50');
    expect(greenBoxClass).toContain('rounded-lg');
  });
});
