import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Card = forwardRef(({ 
  className = "", 
  children, 
  hover = false,
  gradient = false,
  ...props 
}, ref) => {
  const baseStyles = "rounded-lg border bg-white p-6 shadow-sm transition-all duration-200 dark:bg-gray-800 dark:border-gray-700";
  
  const hoverStyles = hover 
    ? "hover:shadow-md hover:scale-[1.02] cursor-pointer" 
    : "";
  
  const gradientStyles = gradient 
    ? "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900" 
    : "";

  return (
    <div
      ref={ref}
      className={cn(
        baseStyles,
        hoverStyles,
        gradientStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";

export default Card;