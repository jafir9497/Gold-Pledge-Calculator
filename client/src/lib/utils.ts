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
  // Open a WhatsApp share dialog that prompts user to select a contact
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function createDataUrl(results: any): Promise<string> {
  return new Promise((resolve) => {
    // Create a canvas element for drawing the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = 600;
    canvas.height = 700;
    
    if (!ctx) {
      resolve(''); // Return empty string if canvas context cannot be created
      return;
    }
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8f8f0');
    gradient.addColorStop(1, '#fff8e0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add header
    ctx.fillStyle = '#94742A';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Gold Pledge Calculator', 20, 50);
    
    // Add gold icon (simplified)
    ctx.beginPath();
    ctx.arc(550, 50, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add date
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.fillText(new Date().toLocaleDateString(), 20, 80);
    
    // Draw divider
    ctx.strokeStyle = '#CCB873';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 90);
    ctx.lineTo(580, 90);
    ctx.stroke();
    
    // Loan details section
    ctx.fillStyle = '#333';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Loan Details', 20, 130);
    
    ctx.font = '18px Arial';
    ctx.fillStyle = '#333';
    const goldPurity = getGoldPurityLabel(results.purity);
    const interestRate = `${results.interestRate}%`;
    const isPrimaryValueWeight = results.goldWeight !== undefined;
    const ratePerGram = `₹${(isPrimaryValueWeight 
      ? results.principalAmount / results.goldWeight! 
      : results.principalAmount / (results.loanAmount! / results.principalAmount * results.goldWeight!)).toFixed(2)}`;
    
    // Draw data
    const detailsY = 170;
    const lineHeight = 35;
    
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Gold Purity:', 40, detailsY);
    ctx.fillText('Interest Rate:', 40, detailsY + lineHeight);
    ctx.fillText('Rate per Gram:', 40, detailsY + lineHeight * 2);
    
    ctx.font = '16px Arial';
    ctx.fillText(goldPurity, 200, detailsY);
    ctx.fillText(interestRate, 200, detailsY + lineHeight);
    ctx.fillText(ratePerGram, 200, detailsY + lineHeight * 2);
    
    // Draw divider
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(20, detailsY + lineHeight * 2.5);
    ctx.lineTo(580, detailsY + lineHeight * 2.5);
    ctx.stroke();
    
    // Main result section
    ctx.fillStyle = '#333';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Calculation Results', 20, detailsY + lineHeight * 3.5);
    
    const resultY = detailsY + lineHeight * 4.5;
    
    // Draw main result
    ctx.fillStyle = '#B8860B';
    ctx.font = 'bold 24px Arial';
    if (isPrimaryValueWeight) {
      ctx.fillText('Required Gold Weight:', 40, resultY);
      ctx.fillText(formatWeight(results.goldWeight!), 320, resultY);
    } else {
      ctx.fillText('Eligible Loan Amount:', 40, resultY);
      ctx.fillText(formatCurrency(results.eligibleAmount), 320, resultY);
    }
    
    // Draw breakdown
    ctx.fillStyle = '#333';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Loan Breakdown', 20, resultY + lineHeight * 2);
    
    const breakdownY = resultY + lineHeight * 3;
    
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Principal Amount:', 40, breakdownY);
    ctx.fillText('Interest Amount:', 40, breakdownY + lineHeight);
    ctx.fillText('Eligible Loan Amount:', 40, breakdownY + lineHeight * 2);
    
    if (isPrimaryValueWeight) {
      ctx.fillText('Gold Weight:', 40, breakdownY + lineHeight * 3);
    } else {
      ctx.fillText('Loan Amount:', 40, breakdownY + lineHeight * 3);
    }
    
    ctx.font = '16px Arial';
    ctx.fillText(formatCurrency(results.principalAmount), 250, breakdownY);
    ctx.fillText(formatCurrency(results.interestAmount), 250, breakdownY + lineHeight);
    ctx.fillText(formatCurrency(results.eligibleAmount), 250, breakdownY + lineHeight * 2);
    
    if (isPrimaryValueWeight) {
      ctx.fillText(formatWeight(results.goldWeight!), 250, breakdownY + lineHeight * 3);
    } else {
      ctx.fillText(formatCurrency(results.loanAmount!), 250, breakdownY + lineHeight * 3);
    }
    
    // Footer
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.fillText('Gold Pledge Calculator - Secure your loans with gold assets', 20, breakdownY + lineHeight * 5);
    
    // Convert canvas to data URL and resolve the promise
    resolve(canvas.toDataURL('image/jpeg', 0.9));
  });
}
