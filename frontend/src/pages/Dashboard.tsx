import React from "react";
import { Header } from "../components/Header";
import { useUserGuardContext } from "app";
import { Button } from "../components/Button";

export default function Dashboard() {
  const { user } = useUserGuardContext();

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-6 inline-block">
          <span className="font-mono text-sm bg-black text-white px-2 py-1">DASHBOARD</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-6">
          <span className="font-mono text-xl md:text-2xl">///</span> Your Legal Documents
        </h1>
        
        <div className="grid gap-8 mt-12">
          <div className="p-8 border-2 border-black bg-white relative">
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-bold mb-4">Welcome, {user.displayName || user.email?.split('@')[0]}!</h2>
              <p className="text-gray-700 mb-6">
                This is your document dashboard where you can create, manage, and download your legal documents.
              </p>
              
              <Button variant="brutalist">
                Create New Document
              </Button>
            </div>
            
            <div className="mt-12">
              <h3 className="text-xl font-serif font-bold mb-4 flex items-center">
                <span className="font-mono text-sm mr-2">///</span> Recent Documents
              </h3>
              
              <div className="border-2 border-black p-8 bg-[#e6e6e6] text-center">
                <p className="text-gray-700 mb-4">You haven't created any documents yet.</p>
                <Button variant="outline">
                  Start Creating
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
