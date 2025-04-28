import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import GoldRateForm from "@/components/admin/gold-rate-form";
import GoldRatesTable from "@/components/admin/gold-rates-table";
import UserManagement from "@/components/admin/user-management";
import { Redirect } from "wouter";
import { Loader2, Coins, Users, Percent } from "lucide-react";
import InterestSchemeManagement from "@/components/admin/interest-scheme-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
  const { user } = useAuth();
  
  const { data: goldRates = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/gold-rates"],
  });
  
  // Redirect if not an admin
  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
        
        <Tabs defaultValue="gold-rates" className="w-full">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full">
            <TabsTrigger value="gold-rates" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              <span>Gold Rate Management</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </TabsTrigger>
            <TabsTrigger value="schemes" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              <span>Interest Schemes</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gold-rates" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
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
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="schemes" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Interest Scheme Management</h2>
              <InterestSchemeManagement />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Calculator section for admin to test */}
      <div className="mt-12 bg-white rounded-md shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Admin Calculator Access</h2>
        <p className="text-gray-600 mb-4">
          As an admin, you also have access to the same calculator tools that regular users have.
          You can use these tools to verify the loan calculations based on the current gold rates.
        </p>
        <a href="/" className="inline-block text-blue-600 hover:text-blue-800 font-medium">
          Go to Calculator →
        </a>
      </div>
    </main>
  );
}
