import { Position } from "../backendApi";
import {
  calculateCurrentValue,
  calculateCurrentValueFromUI,
  calculatePnL,
  calculatePnLFromUI,
  calculatePnLPercentage,
  calculatePnLPercentageFromUI,
  calculatePositionDuration,
  calculatePositionMetricsFromUI,
  formatDuration,
  updatePositionWithCalculatedPnL,
} from "../positionCalculations";

// Test data based on your actual position log
const testPosition: Position = {
  id: "SOL:1758263479708",
  positionId: "SOL:1758263479708",
  market: "SOL",
  direction: "LONG",
  status: "OPEN",
  size: 1,
  entryPrice: 245.1894,
  exitPrice: null,
  currentPrice: 105,
  pnl: 0,
  pnlPercentage: 0,
  leverage: 1,
  liquidationPrice: 196.15152,
  marginUsed: 0,
  openedAt: "2025-09-19T06:31:32.170990Z",
  closedAt: null,
  duration: 0,
  fees: 0,
  points: 0,
};

describe("Position Calculations", () => {
  describe("calculatePnL", () => {
    it("should calculate correct PnL for losing LONG position with 1x leverage (your actual data)", () => {
      // Entry: $245.1894, Current: $105, Collateral: 1.00 USDC, Leverage: 1x
      // Position Size: 1.00 * 1 = 1.00 USDC
      // Asset Quantity: 1.00 / 245.1894 = 0.004078 units
      // Expected PnL: (105 - 245.1894) * 0.004078 = -0.57176
      const pnl = calculatePnL(245.1894, 105, 1, 1, "LONG");
      expect(pnl).toBeCloseTo(-0.57176, 3);
    });

    it("should calculate correct PnL for losing LONG position with 50x leverage", () => {
      // Entry: $245.1894, Current: $105, Collateral: 1.00 USDC, Leverage: 50x
      // Position Size: 1.00 * 50 = 50.00 USDC
      // Asset Quantity: 50.00 / 245.1894 = 0.2039 units
      // Expected PnL: (105 - 245.1894) * 0.2039 = -28.587981
      const pnl = calculatePnL(245.1894, 105, 1, 50, "LONG");
      expect(pnl).toBeCloseTo(-28.587981, 2);
    });

    it("should calculate positive PnL for profitable LONG position", () => {
      // Entry: $100, Current: $110, Collateral: 1.00 USDC, Leverage: 1x
      // Position Size: 1.00 * 1 = 1.00 USDC
      // Asset Quantity: 1.00 / 100 = 0.01 units
      // Expected PnL: (110 - 100) * 0.01 = 0.1
      const pnl = calculatePnL(100, 110, 1, 1, "LONG");
      expect(pnl).toBe(0.1);
    });

    it("should calculate positive PnL for profitable SHORT position", () => {
      // Entry: $100, Current: $90, Collateral: 1.00 USDC, Leverage: 1x
      // Position Size: 1.00 * 1 = 1.00 USDC
      // Asset Quantity: 1.00 / 100 = 0.01 units
      // Expected PnL: (100 - 90) * 0.01 = 0.1
      const pnl = calculatePnL(100, 90, 1, 1, "SHORT");
      expect(pnl).toBe(0.1);
    });

    it("should calculate negative PnL for losing SHORT position", () => {
      // Entry: $100, Current: $110, Collateral: 1.00 USDC, Leverage: 1x
      // Expected PnL: (100 - 110) * 0.01 = -0.1
      const pnl = calculatePnL(100, 110, 1, 1, "SHORT");
      expect(pnl).toBe(-0.1);
    });

    it("should handle zero PnL when prices are equal", () => {
      const pnl = calculatePnL(100, 100, 1, 1, "LONG");
      expect(pnl).toBe(0);
    });

    it("should handle different leverage multipliers correctly", () => {
      // Test with 10x leverage
      const pnl1 = calculatePnL(100, 110, 1, 10, "LONG"); // 1.00 USDC * 10x = 10 USDC position
      expect(pnl1).toBe(1); // (110 - 100) * (10/100) = 1

      // Test with 50x leverage
      const pnl2 = calculatePnL(100, 110, 1, 50, "LONG"); // 1.00 USDC * 50x = 50 USDC position
      expect(pnl2).toBe(5); // (110 - 100) * (50/100) = 5
    });

    it("should default to 1x leverage when not provided", () => {
      const pnl = calculatePnL(100, 110, 1, undefined, "LONG");
      expect(pnl).toBe(0.1); // Same as 1x leverage
    });
  });

  describe("calculatePnLPercentage", () => {
    it("should calculate correct percentage for your actual losing position with 1x leverage", () => {
      // Entry: $245.1894, Current: $105, Collateral: 1.00 USDC, Leverage: 1x
      // PnL: -0.571894, Collateral: 1.00, Percentage: (-0.571894/1.00) * 100 = -57.19%
      const percentage = calculatePnLPercentage(245.1894, 105, 1, 1, "LONG");
      expect(percentage).toBeCloseTo(-57.19, 1);
    });

    it("should calculate correct percentage for losing position with 50x leverage", () => {
      // Entry: $245.1894, Current: $105, Collateral: 1.00 USDC, Leverage: 50x
      // PnL: -28.587981, Collateral: 1.00, Percentage: (-28.587981/1.00) * 100 = -2858.8%
      const percentage = calculatePnLPercentage(245.1894, 105, 1, 50, "LONG");
      expect(percentage).toBeCloseTo(-2858.8, 1);
    });

    it("should calculate positive percentage for profitable position", () => {
      // Entry: $100, Current: $110, Collateral: 1.00 USDC, Leverage: 1x
      // PnL: 0.1, Collateral: 1.00, Percentage: (0.1/1.00) * 100 = 10%
      const percentage = calculatePnLPercentage(100, 110, 1, 1, "LONG");
      expect(percentage).toBe(10);
    });

    it("should calculate amplified percentage with leverage", () => {
      // Entry: $100, Current: $110, Collateral: 1.00 USDC, Leverage: 10x
      // PnL: 1.0, Collateral: 1.00, Percentage: (1.0/1.00) * 100 = 100%
      const percentage = calculatePnLPercentage(100, 110, 1, 10, "LONG");
      expect(percentage).toBe(100);
    });

    it("should handle zero collateral gracefully", () => {
      const percentage = calculatePnLPercentage(100, 110, 0, 1, "LONG");
      expect(percentage).toBe(0);
    });

    it("should round to 2 decimal places", () => {
      const percentage = calculatePnLPercentage(
        100,
        133.333333,
        0.01,
        1,
        "LONG"
      );
      expect(percentage.toString()).toMatch(/^\d+\.\d{1,2}$/);
    });
  });

  describe("calculateCurrentValue", () => {
    it("should calculate current value for profitable position", () => {
      // Entry: $100, Current: $110, Collateral: 1.00 USDC, Leverage: 1x
      // Initial Investment: 1.00, PnL: 0.1, Current Value: 1.1
      const currentValue = calculateCurrentValue(100, 110, 1, 1, "LONG");
      expect(currentValue).toBe(1.1);
    });

    it("should calculate current value for losing position", () => {
      // Entry: $100, Current: $90, Collateral: 1.00 USDC, Leverage: 1x
      // Initial Investment: 1.00, PnL: -0.1, Current Value: 0.9
      const currentValue = calculateCurrentValue(100, 90, 1, 1, "LONG");
      expect(currentValue).toBe(0.9);
    });

    it("should calculate current value with leverage", () => {
      // Entry: $100, Current: $110, Collateral: 1.00 USDC, Leverage: 10x
      // Initial Investment: 1.00, PnL: 1.0, Current Value: 2.0
      const currentValue = calculateCurrentValue(100, 110, 1, 10, "LONG");
      expect(currentValue).toBe(2);
    });
  });

  describe("updatePositionWithCalculatedPnL", () => {
    it("should update position with calculated PnL values", () => {
      const currentPrice = 105;
      const updatedPosition = updatePositionWithCalculatedPnL(
        testPosition,
        currentPrice
      );

      expect(updatedPosition.currentPrice).toBe(105);
      // With 1x leverage (default), PnL should be -0.57176
      expect(updatedPosition.pnl).toBeCloseTo(-0.57176, 3);
      expect(updatedPosition.pnlPercentage).toBeCloseTo(-57.18, 1);

      // Should preserve other fields
      expect(updatedPosition.id).toBe(testPosition.id);
      expect(updatedPosition.market).toBe(testPosition.market);
      expect(updatedPosition.entryPrice).toBe(testPosition.entryPrice);
    });
  });

  describe("calculatePositionDuration", () => {
    it("should calculate duration in seconds", () => {
      const pastTime = new Date(Date.now() - 5000).toISOString(); // 5 seconds ago
      const duration = calculatePositionDuration(pastTime);
      expect(duration).toBeGreaterThanOrEqual(4);
      expect(duration).toBeLessThanOrEqual(6);
    });

    it("should handle very recent positions", () => {
      const recentTime = new Date(Date.now() - 100).toISOString(); // 100ms ago
      const duration = calculatePositionDuration(recentTime);
      expect(duration).toBe(0);
    });
  });

  describe("formatDuration", () => {
    it("should format seconds", () => {
      expect(formatDuration(30)).toBe("30s");
      expect(formatDuration(59)).toBe("59s");
    });

    it("should format minutes", () => {
      expect(formatDuration(60)).toBe("1m");
      expect(formatDuration(150)).toBe("2m");
      expect(formatDuration(3599)).toBe("59m");
    });

    it("should format hours and minutes", () => {
      expect(formatDuration(3600)).toBe("1h");
      expect(formatDuration(3660)).toBe("1h 1m");
      expect(formatDuration(7200)).toBe("2h");
      expect(formatDuration(7320)).toBe("2h 2m");
    });

    it("should format days and hours", () => {
      expect(formatDuration(86400)).toBe("1d");
      expect(formatDuration(90000)).toBe("1d 1h");
      expect(formatDuration(172800)).toBe("2d");
    });
  });

  describe("UI-Friendly Functions", () => {
    describe("calculatePnLFromUI", () => {
      it("should calculate PnL with UI-converted amounts", () => {
        // Entry: $100, Current: $110, UI Amount: 1.00 USDC (already multiplied by 100), Leverage: 1x
        // This converts 1.00 back to 0.01 internally, then calculates: (110-100) * (1.00/100) = 0.1
        const pnl = calculatePnLFromUI(100, 110, 1.0, 1, "LONG");
        expect(pnl).toBe(0.1);
      });

      it("should handle leverage correctly with UI amounts", () => {
        // Entry: $100, Current: $110, UI Amount: 1.00 USDC, Leverage: 10x
        // This converts 1.00 back to 0.01, then calculates: (110-100) * (10.00/100) = 1.0
        const pnl = calculatePnLFromUI(100, 110, 1.0, 10, "LONG");
        expect(pnl).toBe(1); // 10x leverage amplifies the PnL
      });
    });

    describe("calculatePnLPercentageFromUI", () => {
      it("should calculate percentage with UI-converted amounts", () => {
        // Entry: $100, Current: $110, UI Amount: 1.00 USDC, Leverage: 1x
        // PnL: 0.1, Investment: 1.00, Percentage: (0.1/1.00) * 100 = 10%
        const percentage = calculatePnLPercentageFromUI(
          100,
          110,
          1.0,
          1,
          "LONG"
        );
        expect(percentage).toBe(10);
      });

      it("should handle leverage correctly in percentage calculation", () => {
        // Entry: $100, Current: $110, UI Amount: 1.00 USDC, Leverage: 10x
        // PnL: 1.0, Investment: 1.00, Percentage: (1.0/1.00) * 100 = 100%
        const percentage = calculatePnLPercentageFromUI(
          100,
          110,
          1.0,
          10,
          "LONG"
        );
        expect(percentage).toBe(100);
      });
    });

    describe("calculateCurrentValueFromUI", () => {
      it("should calculate current value with UI-converted amounts", () => {
        // Entry: $100, Current: $110, UI Amount: 1.00 USDC, Leverage: 1x
        // Initial: 1.00, PnL: 0.1, Current Value: 1.1
        const currentValue = calculateCurrentValueFromUI(
          100,
          110,
          1.0,
          1,
          "LONG"
        );
        expect(currentValue).toBe(1.1);
      });

      it("should handle leverage in current value calculation", () => {
        // Entry: $100, Current: $110, UI Amount: 1.00 USDC, Leverage: 10x
        // Initial: 1.00, PnL: 1.0, Current Value: 2.0
        const currentValue = calculateCurrentValueFromUI(
          100,
          110,
          1.0,
          10,
          "LONG"
        );
        expect(currentValue).toBe(2);
      });
    });

    describe("calculatePositionMetricsFromUI", () => {
      it("should calculate all metrics at once", () => {
        // Entry: $100, Current: $110, UI Amount: 1.00 USDC, Leverage: 10x
        const metrics = calculatePositionMetricsFromUI(
          100,
          110,
          1.0,
          10,
          "LONG"
        );

        expect(metrics.pnl).toBe(1);
        expect(metrics.pnlPercentage).toBe(100);
        expect(metrics.currentValue).toBe(2);
        expect(metrics.isProfit).toBe(true);
      });

      it("should handle losing positions", () => {
        // Entry: $100, Current: $90, UI Amount: 1.00 USDC, Leverage: 5x
        const metrics = calculatePositionMetricsFromUI(100, 90, 1.0, 5, "LONG");

        expect(metrics.pnl).toBe(-0.5);
        expect(metrics.pnlPercentage).toBe(-50);
        expect(metrics.currentValue).toBe(0.5);
        expect(metrics.isProfit).toBe(false);
      });

      it("should match your actual position data with 1x leverage", () => {
        // Your actual position: Entry: $245.1894, Current: $105, UI Amount: 1.00 USDC, Leverage: 1x
        const metrics = calculatePositionMetricsFromUI(
          245.1894,
          105,
          1.0,
          1,
          "LONG"
        );

        expect(metrics.pnl).toBeCloseTo(-0.57176, 3);
        expect(metrics.pnlPercentage).toBeCloseTo(-57.18, 1);
        expect(metrics.currentValue).toBeCloseTo(0.42824, 3);
        expect(metrics.isProfit).toBe(false);
      });
    });
  });
});

// Test data for manual verification
export const testCases = {
  // Your actual position data with different leverage scenarios
  realPosition1x: {
    entryPrice: 245.1894,
    currentPrice: 105,
    collateral: 1,
    actualCollateral: 1.0, // UI value (collateral * 100)
    leverage: 1,
    direction: "LONG" as const,
    expectedPnL: -0.57176, // Precise calculation
    expectedPnLPercent: -57.18,
  },

  realPosition50x: {
    entryPrice: 245.1894,
    currentPrice: 105,
    collateral: 1,
    actualCollateral: 1.0, // UI value (collateral * 100)
    leverage: 50,
    direction: "LONG" as const,
    expectedPnL: -28.587981, // Precise calculation
    expectedPnLPercent: -2858.8,
  },

  // Simple test cases
  profitableLong1x: {
    entryPrice: 100,
    currentPrice: 110,
    collateral: 1,
    actualCollateral: 1.0,
    leverage: 1,
    direction: "LONG" as const,
    expectedPnL: 0.1,
    expectedPnLPercent: 10,
  },

  profitableLong10x: {
    entryPrice: 100,
    currentPrice: 110,
    collateral: 1,
    actualCollateral: 1.0,
    leverage: 10,
    direction: "LONG" as const,
    expectedPnL: 1.0,
    expectedPnLPercent: 100,
  },

  profitableShort1x: {
    entryPrice: 100,
    currentPrice: 90,
    collateral: 1,
    actualCollateral: 1.0,
    leverage: 1,
    direction: "SHORT" as const,
    expectedPnL: 0.1,
    expectedPnLPercent: 10,
  },
};
