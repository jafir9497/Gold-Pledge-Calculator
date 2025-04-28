import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import LoanAmountForm from "@/components/calculator/loan-amount-form";
import GoldWeightForm from "@/components/calculator/gold-weight-form";
import ResultsDisplay from "@/components/calculator/results-display";
import { LoanCalculation } from "@shared/schema";
import { ArrowRight, Calculator } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [calculationResults, setCalculationResults] = useState<LoanCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  if (user?.role === "admin") {
    setLocation("/admin");
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Gold Loan Calculator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <div className="gold-card p-6">
            <Tabs defaultValue="amount" className="mb-6">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="amount" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <span>By Loan Amount</span>
                </TabsTrigger>
                <TabsTrigger value="weight" className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>By Gold Weight</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="amount">
                <LoanAmountForm 
                  onCalculate={(result) => {
                    setCalculationResults(result);
                    setIsCalculating(false);
                  }} 
                  onCalculating={() => setIsCalculating(true)}
                />
              </TabsContent>
              
              <TabsContent value="weight">
                <GoldWeightForm 
                  onCalculate={(result) => {
                    setCalculationResults(result);
                    setIsCalculating(false);
                  }}
                  onCalculating={() => setIsCalculating(true)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Results Column */}
        <div className="lg:col-span-1">
          <ResultsDisplay 
            results={calculationResults}
            isCalculating={isCalculating}
          />
        </div>
      </div>
    </main>
  );
}
