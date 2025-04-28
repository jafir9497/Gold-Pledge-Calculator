import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { GoldRate } from "@shared/schema";

const formSchema = z.object({
  "24k": z.coerce.number().positive("Rate must be positive").min(1, "Rate must be at least 1"),
  "22k": z.coerce.number().positive("Rate must be positive").min(1, "Rate must be at least 1"),
  "18k": z.coerce.number().positive("Rate must be positive").min(1, "Rate must be at least 1"),
  "mixed": z.coerce.number().positive("Rate must be positive").min(1, "Rate must be at least 1"),
});

interface GoldRateFormProps {
  onSuccess: () => void;
}

export default function GoldRateForm({ onSuccess }: GoldRateFormProps) {
  const { toast } = useToast();
  
  const { data: goldRates = [] } = useQuery<GoldRate[]>({
    queryKey: ["/api/gold-rates"],
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      "24k": 0,
      "22k": 0,
      "18k": 0,
      "mixed": 0,
    },
  });
  
  // Set default values when gold rates are loaded
  useEffect(() => {
    if (goldRates.length > 0) {
      const rateValues: Record<string, number> = {
        "24k": 0,
        "22k": 0,
        "18k": 0,
        "mixed": 0,
      };
      
      goldRates.forEach((rate) => {
        if (rate.purity in rateValues) {
          rateValues[rate.purity as keyof typeof rateValues] = rate.ratePerGram;
        }
      });
      
      form.reset(rateValues);
    }
  }, [goldRates, form]);
  
  const updateRateMutation = useMutation({
    mutationFn: async (data: { purity: string; ratePerGram: number }) => {
      const res = await apiRequest("POST", "/api/gold-rates", data);
      return await res.json();
    },
    onSuccess: () => {
      onSuccess();
      toast({
        title: "Gold rate updated",
        description: "The gold rate has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    for (const [purity, ratePerGram] of Object.entries(values)) {
      await updateRateMutation.mutateAsync({ purity, ratePerGram });
    }
  }
  
  return (
    <Card className="p-6 border-gold-100">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="24k"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>24K Gold Rate (per gram)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">₹</span>
                      </div>
                      <Input 
                        placeholder="0.00" 
                        type="number" 
                        step="0.01"
                        className="pl-8" 
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="22k"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>22K Gold Rate (per gram)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">₹</span>
                      </div>
                      <Input 
                        placeholder="0.00" 
                        type="number" 
                        step="0.01"
                        className="pl-8" 
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="18k"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>18K Gold Rate (per gram)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">₹</span>
                      </div>
                      <Input 
                        placeholder="0.00" 
                        type="number" 
                        step="0.01"
                        className="pl-8" 
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="mixed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mixed Gold Rate (per gram)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">₹</span>
                      </div>
                      <Input 
                        placeholder="0.00" 
                        type="number" 
                        step="0.01"
                        className="pl-8" 
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-gold-600 hover:bg-gold-700"
              disabled={updateRateMutation.isPending}
            >
              {updateRateMutation.isPending ? "Updating..." : "Update Gold Rates"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
