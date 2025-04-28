import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { useAuth, extendedUserSchema, loginSchema } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof extendedUserSchema>>({
    resolver: zodResolver(extendedUserSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "user",
    },
  });

  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  function onRegisterSubmit(values: z.infer<typeof extendedUserSchema>) {
    registerMutation.mutate(values);
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[80vh]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
        {/* Left Column (Form) */}
        <Card className="w-full">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  Account Access
                </CardTitle>
                <TabsList>
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>
                Please login to your account or create a new one.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gold-600 hover:bg-gold-700"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Create a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Account Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="admin" id="role-admin" />
                                <Label htmlFor="role-admin">Admin</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="user" id="role-user" />
                                <Label htmlFor="role-user">User</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gold-600 hover:bg-gold-700"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
        
        {/* Right Column (Hero) */}
        <div className="flex flex-col justify-center">
          <div className="mb-6 flex justify-center">
            <div className="h-20 w-20 rounded-full bg-gold-100 flex items-center justify-center">
              <Coins className="h-10 w-10 text-gold-600" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="gold-gradient-text">GoldPledge</span> Calculator
          </h1>
          
          <p className="text-center text-gray-600 mb-8">
            The smart way to calculate gold loans with precision and ease. 
            Get instant estimates based on weight or loan amount.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gold-50 rounded-lg border border-gold-100">
              <h3 className="font-medium text-slate-800 mb-2">For Users</h3>
              <p className="text-sm text-gray-600">Calculate your loan instantly based on gold weight or loan amount.</p>
            </div>
            
            <div className="p-4 bg-gold-50 rounded-lg border border-gold-100">
              <h3 className="font-medium text-slate-800 mb-2">For Admins</h3>
              <p className="text-sm text-gray-600">Manage gold rates for different purities to ensure accurate calculations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
