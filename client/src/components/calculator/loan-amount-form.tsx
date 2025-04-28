import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InterestScheme, LoanCalculation } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getGoldPurityLabel } from "@/lib/utils";

const formSchema = z.object({
  loanAmount: z.coerce.number().positive("Amount must be positive").min(1000, "Minimum loan amount is ₹1,000"),
  purity: z.enum(["24k", "22k", "18k", "mixed"], {
    required_error: "Please select gold purity",
  }),
  interestRate: z.coerce.number().positive("Interest rate must be positive"),
});

interface LoanAmountFormProps {
  onCalculate: (result: LoanCalculation) => void;
  onCalculating: () => void;
}

export default function LoanAmountForm({ onCalculate, onCalculating }: LoanAmountFormProps) {
  const { toast } = useToast();
  
  const { data: interestSchemes = [] } = useQuery<InterestScheme[]>({
    queryKey: ["/api/interest-schemes"],
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loanAmount: undefined,
      purity: "24k",
      interestRate: 0.5,
    },
  });
  
  const calculateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/calculate/by-amount", data);
      return await res.json() as LoanCalculation;
    },
    onSuccess: (data) => {
      onCalculate(data);
      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.querySelector('.results-display');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Calculation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    onCalculating();
    calculateMutation.mutate(values);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="loanAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Desired Loan Amount (₹)</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₹</span>
                  </div>
                  <Input 
                    placeholder="100000" 
                    type="number" 
                    className="pl-8" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormDescription>
                Enter the amount you wish to borrow
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="purity"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Gold Purity</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24k" id="purity-24k" />
                    <Label htmlFor="purity-24k">24K (99.9% Pure)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="22k" id="purity-22k" />
                    <Label htmlFor="purity-22k">22K (91.6% Pure)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="18k" id="purity-18k" />
                    <Label htmlFor="purity-18k">18K (75% Pure)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mixed" id="purity-mixed" />
                    <Label htmlFor="purity-mixed">Mixed</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="interestRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interest Scheme</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseFloat(value))} 
                defaultValue={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an interest scheme" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {interestSchemes.map((scheme) => (
                    <SelectItem key={scheme.id} value={scheme.rate.toString()}>
                      {scheme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-gold-600 hover:bg-gold-700"
          disabled={calculateMutation.isPending}
        >
          {calculateMutation.isPending ? "Calculating..." : "Calculate Required Gold Weight"}
        </Button>
      </form>
    </Form>
  );
}
