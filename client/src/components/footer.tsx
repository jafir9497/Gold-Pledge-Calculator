import { Coins } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-850 text-white py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <Coins className="text-gold-500 h-5 w-5 mr-2" />
              <span className="font-bold">GoldPledge Calculator</span>
            </div>
            <p className="text-gray-400 text-sm mt-1">Calculate gold loan amounts with precision</p>
          </div>
          <div className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} GoldPledge Calculator. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
