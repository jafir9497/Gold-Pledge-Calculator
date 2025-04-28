import { Button } from "@/components/ui/button";
import { Coins, LogOut, Settings } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  
  return (
    <header className="bg-slate-850 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <Coins className="text-gold-500 h-6 w-6 mr-3" />
            <h1 className="text-xl font-bold">GoldPledge Calculator</h1>
          </div>
        </Link>
        
        <div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-gold-500">
                    <AvatarFallback className={cn(
                      "bg-slate-700 text-white",
                      user.role === "admin" ? "bg-gold-600" : "bg-slate-700"
                    )}>
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 leading-none p-2">
                  <p className="font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </p>
                </div>
                
                {user.role === "admin" && (
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => window.location.href = "/admin"}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem
                  className="cursor-pointer text-red-500 focus:text-red-600"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button className="bg-gold-600 hover:bg-gold-700 text-white">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
