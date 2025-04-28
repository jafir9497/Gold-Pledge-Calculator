import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import GoldRateForm from "@/components/admin/gold-rate-form";
import GoldRatesTable from "@/components/admin/gold-rates-table";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  
  const { data: goldRates, isLoading, refetch } = useQuery({
    queryKey: ["/api/gold-rates"],
  });
  
  // Redirect if not an admin
  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Admin Dashboard</h1>
        
        <div className="gold-card p-6">
          <h2 className="text-xl font-semibold mb-6">Gold Rate Management</h2>
          
          <GoldRateForm onSuccess={refetch} />
          
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-4">Current Gold Rates</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
              </div>
            ) : (
              <GoldRatesTable goldRates={goldRates || []} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
