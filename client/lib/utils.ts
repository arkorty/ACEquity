import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
