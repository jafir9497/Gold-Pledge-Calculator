import { Card, CardContent } from "@/components/ui/card";
import { LoanCalculation } from "@shared/schema";
import { formatCurrency, formatWeight, getGoldPurityLabel } from "@/lib/utils";
import { Calculator, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaWhatsapp } from "react-icons/fa";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ResultsDisplayProps {
  results: LoanCalculation | null;
  isCalculating: boolean;
}

export default function ResultsDisplay({ results, isCalculating }: ResultsDisplayProps) {
  const [isSharingImage, setIsSharingImage] = useState(false);
  const { toast } = useToast();

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
Rate Per Gram: ${formatCurrency(isPrimaryValueWeight ? results.principalAmount / results.goldWeight! : results.principalAmount / (results.loanAmount! / results.principalAmount * results.goldWeight!))} per gram
${isPrimaryValueWeight 
  ? `Required Gold Weight: ${formatWeight(results.goldWeight!)}`
  : `Loan Amount: ${formatCurrency(results.loanAmount!)}`}
Principal Amount: ${formatCurrency(results.principalAmount)}
Interest Amount: ${formatCurrency(results.interestAmount)}
Eligible Loan Amount: ${formatCurrency(results.eligibleAmount)}
`.trim();

  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleShareViaWhatsApp = () => {
    setIsContactDialogOpen(true);
  };

  const handleShareWithContact = () => {
    try {
      if (!phoneNumber) {
        toast({
          title: "Error",
          description: "Please enter a phone number",
          variant: "destructive",
        });
        return;
      }

      // Format phone number (remove spaces and add country code if needed)
      const formattedNumber = phoneNumber.replace(/\s+/g, '');
      const whatsappNumber = formattedNumber.startsWith('+') ? formattedNumber.substring(1) : formattedNumber;
      
      // Create WhatsApp URL with phone number and message
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(shareMessageText)}`;
      window.open(whatsappUrl, "_blank");
      setIsContactDialogOpen(false);
      setPhoneNumber("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share calculation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadImage = () => {
    if (!imageDataUrl) return;

    // Create a temporary anchor element
    const link = document.createElement("a");
    link.href = imageDataUrl;
    link.download = "gold-calculation.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Card className="h-full results-display">
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

                <div className="text-gray-600">Rate Per Gram:</div>
                <div className="font-medium text-gray-900">
                  {formatCurrency(isPrimaryValueWeight 
                    ? results.principalAmount / results.goldWeight! 
                    : results.principalAmount / (results.loanAmount! / results.principalAmount * results.goldWeight!))}
                </div>
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
              onClick={handleShareViaWhatsApp}
              disabled={isSharingImage}
            >
              {isSharingImage ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FaWhatsapp className="text-lg" />
              )}
              <span>Share on WhatsApp</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Customer's Phone Number</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <Input
              type="tel"
              placeholder="Enter phone number (with country code)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-2">
              Format: Country code + Number (e.g., +919876543210)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareWithContact}>
              Share via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}