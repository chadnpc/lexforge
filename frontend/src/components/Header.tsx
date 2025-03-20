import React from "react";
import { Button } from "./Button";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "app";

export function Header() {
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();

  return (
    <header className="flex items-center justify-between py-6 px-6 md:px-8 lg:px-12 border-b-2 border-black bg-white">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="flex items-center justify-center w-10 h-10 bg-black text-white font-bold">
          L
        </div>
        <span className="font-serif text-xl font-bold tracking-tight">LexForge</span>
      </div>
      
      <nav className="hidden md:flex items-center space-x-8">
        <a href="/#features" className="font-medium hover:underline">Features</a>
        <a href="/#how-it-works" className="font-medium hover:underline">How It Works</a>
        {user && (
          <a href="/dashboard" className="font-medium hover:underline">Dashboard</a>
        )}
      </nav>
      
      <div className="flex items-center gap-4">
        {!loading && (
          user ? (
            <>
              <div className="hidden md:block">
                <span className="mr-2 text-sm">Hello, {user.displayName || user.email?.split('@')[0]}</span>
              </div>
              <Button 
                variant="outline"
                onClick={() => navigate('/logout')}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline"
                onClick={() => navigate('/login')}
              >
                Log In
              </Button>
              <Button 
                variant="brutalist"
                onClick={() => navigate('/login')}
              >
                Sign Up
              </Button>
            </>
          )
        )}
      </div>
    </header>
  );
}

