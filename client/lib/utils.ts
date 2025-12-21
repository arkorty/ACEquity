import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Constants for price formatting
const TICK_SIZE = 0.05;

/**
 * Rounds a price to the nearest tick size (0.05)
 * @param price - The price to round
 * @returns The price rounded to the nearest tick
 */
export function roundToTick(price: number): number {
  return Math.round(price / TICK_SIZE) * TICK_SIZE;
}

/**
 * Formats a price to the nearest tick size and returns it as a formatted string
 * Use this only for SEBI-prescribed scenarios (e.g., circuit limits, order prices)
 * @param price - The price to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns The formatted price string rounded to tick size
 */
export function formatPriceToTick(price: number | undefined, decimals: number = 2): string {
  if (price === undefined || price === null || isNaN(price)) return "0.00";
  const rounded = roundToTick(price);
  return rounded.toFixed(decimals);
}

/**
 * Formats a price as a string without tick size rounding
 * Use this for display purposes (stock prices, portfolio values, etc.)
 * @param price - The price to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns The formatted price string
 */
export function formatPrice(price: number | undefined, decimals: number = 2): string {
  if (price === undefined || price === null || isNaN(price)) return "0.00";
  return price.toFixed(decimals);
}

export function formatNumberIN(num: number | undefined): string {
  if (num === undefined || num === null) return "0";
  
  const value = Number(num);
  if (isNaN(value)) return "0";

  if (value >= 10000000) {
    return (value / 10000000).toFixed(2) + " Crore";
  } else if (value >= 100000) {
    return (value / 100000).toFixed(2) + " Lakh";
  } else {
    return value.toLocaleString("en-IN");
  }
}
