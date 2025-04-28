import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(2)} grams`;
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getFormattedDate(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export const getGoldPurityLabel = (purity: string): string => {
  switch (purity) {
    case '24k':
      return '24K (99.9% Pure)';
    case '22k':
      return '22K (91.6% Pure)';
    case '18k':
      return '18K (75% Pure)';
    case 'mixed':
      return 'Mixed';
    default:
      return capitalizeFirst(purity);
  }
};

export function createWhatsAppLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
