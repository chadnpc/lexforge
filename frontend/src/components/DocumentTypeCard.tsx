import React from "react";
import { cn } from "../utils/cn";

interface DocumentTypeCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DocumentTypeCard({ title, description, icon, className, onClick }: DocumentTypeCardProps) {
  return (
    <div 
      className={cn(
        "relative p-6 border-2 border-black bg-white cursor-pointer hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition-all",
        className
      )}
      onClick={onClick}
    >
      {icon && (
        <div className="mb-4 p-2 w-12 h-12 flex items-center justify-center border-2 border-black">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold font-serif mb-2 flex items-center gap-2">
        <span className="text-sm font-mono">///</span> {title}
      </h3>
      <p className="text-gray-700">{description}</p>
    </div>
  );
}
