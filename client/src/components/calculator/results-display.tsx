import { Card, CardContent } from "@/components/ui/card";
import { LoanCalculation } from "@shared/schema";
import { formatCurrency, formatWeight, getGoldPurityLabel, createWhatsAppLink, createDataUrl } from "@/lib/utils";
import { Calculator, Download, Image, Loader2, Share, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaWhatsapp } from "react-icons/fa";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ResultsDisplayProps {
  results: LoanCalculation | null;
  isCalculating: boolean;
}

export default function ResultsDisplay({ results, isCalculating }: ResultsDisplayProps) {
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
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

  const handleShareViaWhatsApp = async () => {
    try {
      setIsSharingImage(true);
      // Generate the image data URL
      const dataUrl = await createDataUrl(results);
      setImageDataUrl(dataUrl);
      
      // Open contact selection dialog
      setIsContactDialogOpen(true);
      setIsSharingImage(false);
    } catch (error) {
      setIsSharingImage(false);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleShareWithContact = () => {
    let phoneNumber = "";
    
    if (selectedContact === "custom" && customNumber) {
      // Remove any non-digit characters
      phoneNumber = customNumber.replace(/\D/g, "");
      
      if (phoneNumber.length < 10) {
        toast({
          title: "Invalid Number",
          description: "Please enter a valid phone number",
          variant: "destructive",
        });
        return;
      }
    } else if (selectedContact) {
      phoneNumber = selectedContact;
    } else {
      toast({
        title: "No Contact Selected",
        description: "Please select a contact to share with",
        variant: "destructive",
      });
      return;
    }
    
    // Create a blob from data URL
    if (imageDataUrl) {
      fetch(imageDataUrl)
        .then(res => res.blob())
        .then(blob => {
          // Create a file from the blob
          const file = new File([blob], "gold-calculation.jpg", { type: "image/jpeg" });
          
          // Create a WhatsApp share URL with the phone number
          const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(shareMessageText)}`;
          
          // Try to share the file - this may not work in all browsers
          if (navigator.share) {
            navigator.share({
              title: "Gold Loan Calculation",
              text: shareMessageText,
              files: [file]
            }).catch(() => {
              // Fallback to opening WhatsApp with just the text
              window.open(whatsappUrl, "_blank");
            });
          } else {
            // Fallback to opening WhatsApp with just the text
            window.open(whatsappUrl, "_blank");
          }
          
          setIsContactDialogOpen(false);
        });
    } else {
      // If no image, just share the text
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(shareMessageText)}`;
      window.open(whatsappUrl, "_blank");
      setIsContactDialogOpen(false);
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
      
      {/* Contact Selection Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share with Contact</DialogTitle>
            <DialogDescription>
              Select a contact to share the calculation with via WhatsApp.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact" className="text-right">
                Contact
              </Label>
              <Select
                value={selectedContact}
                onValueChange={setSelectedContact}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="919898989898">Manager</SelectItem>
                  <SelectItem value="919797979797">Office</SelectItem>
                  <SelectItem value="919696969696">Branch Manager</SelectItem>
                  <SelectItem value="custom">Custom Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedContact === "custom" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value)}
                  placeholder="Enter phone number with country code"
                  className="col-span-3"
                />
              </div>
            )}
            
            {imageDataUrl && (
              <div className="mt-4 border rounded-md overflow-hidden">
                <img 
                  src={imageDataUrl} 
                  alt="Calculation Result" 
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            {imageDataUrl && (
              <Button variant="outline" onClick={handleDownloadImage} type="button">
                <Download className="mr-2 h-4 w-4" />
                Download Image
              </Button>
            )}
            <Button onClick={handleShareWithContact} type="submit">
              <FaWhatsapp className="mr-2 h-4 w-4" />
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
