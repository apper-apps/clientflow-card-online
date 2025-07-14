import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Card = React.forwardRef(({ 
  className, 
  children, 
  hover = false,
  gradient = false,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-white p-6 shadow-sm transition-all duration-200 dark:bg-gray-800 dark:border-gray-700",
        hover && "hover:shadow-md hover:scale-[1.02] cursor-pointer",
        gradient && "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
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