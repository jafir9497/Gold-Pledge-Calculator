import { Card, CardContent } from "@/components/ui/card";
import { LoanCalculation } from "@shared/schema";
import { formatCurrency, formatWeight, getGoldPurityLabel, createWhatsAppLink } from "@/lib/utils";
import { Calculator, Loader2, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaWhatsapp } from "react-icons/fa";

interface ResultsDisplayProps {
  results: LoanCalculation | null;
  isCalculating: boolean;
}

export default function ResultsDisplay({ results, isCalculating }: ResultsDisplayProps) {
  if (isCalculating) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gold-600 mb-4" />
          <p className="text-gray-500">Calculating results...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!results) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <Calculator className="h-10 w-10 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">Fill the form and calculate to see results</p>
        </CardContent>
      </Card>
    );
  }
  
  const isPrimaryValueWeight = results.goldWeight !== undefined;
  
  const shareMessageText = `
Gold Loan Calculation:

Gold Purity: ${getGoldPurityLabel(results.purity)}
Interest Rate: ${results.interestRate}%
${isPrimaryValueWeight 
  ? `Required Gold Weight: ${formatWeight(results.goldWeight!)}`
  : `Loan Amount: ${formatCurrency(results.loanAmount!)}`}
Eligible Loan Amount: ${formatCurrency(results.eligibleAmount)}
`.trim();
  
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Calculation Results</h3>
        
        <div className="space-y-4">
          <div className="bg-gold-50 p-4 rounded-md border border-gold-100">
            <h4 className="font-medium text-slate-800 mb-1">Loan Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">Gold Purity:</div>
              <div className="font-medium text-gray-900">{getGoldPurityLabel(results.purity)}</div>
              
              <div className="text-gray-600">Interest Rate:</div>
              <div className="font-medium text-gray-900">{results.interestRate}%</div>
            </div>
          </div>
          
          <div className="bg-gold-50 p-4 rounded-md border border-gold-100">
            <h4 className="font-medium text-slate-800 mb-1">
              {isPrimaryValueWeight ? "Required Gold Weight" : "Eligible Loan Amount"}
            </h4>
            <div className="text-2xl font-bold text-gold-600 mb-2">
              {isPrimaryValueWeight 
                ? formatWeight(results.goldWeight!) 
                : formatCurrency(results.eligibleAmount)}
            </div>
            <p className="text-xs text-gray-600">
              {isPrimaryValueWeight 
                ? "Weight of gold required for your desired loan amount." 
                : "Maximum loan amount based on your gold weight."}
            </p>
          </div>
          
          <div className="p-4 rounded-md border border-gray-200">
            <h4 className="font-medium text-slate-800 mb-1">Loan Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Principal Amount:</span>
                <span className="font-medium text-gray-900">{formatCurrency(results.principalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interest Amount:</span>
                <span className="font-medium text-gray-900">{formatCurrency(results.interestAmount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                <span className="text-gray-800 font-medium">Eligible Loan Amount:</span>
                <span className="font-bold text-gray-900">{formatCurrency(results.eligibleAmount)}</span>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
            onClick={() => window.open(createWhatsAppLink(shareMessageText), '_blank')}
          >
            <FaWhatsapp className="text-lg" />
            <span>Share on WhatsApp</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
