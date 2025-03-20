import React from "react";
import { cn } from "../utils/cn";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

export function FeatureCard({ title, description, icon, className }: FeatureCardProps) {
  return (
    <div className={cn(
      "group relative p-6 border-2 border-black bg-white hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition-all",
      className
    )}>
      <div className="mb-4 p-2 w-12 h-12 flex items-center justify-center border-2 border-black">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-serif mb-2">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </div>
  );
}
