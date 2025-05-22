import * as React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface PageHeaderProps {
  children?: React.ReactNode;
}

export function Header({
  children,
  className,
}: PageHeaderProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <header className={cn("mx-auto max-w-6xl", className)}>
      <h1 className="text-xl font-bold tracking-wider md:text-3xl">
        {children}
      </h1>
      <Separator className="my-4 h-1 rounded border-0 bg-gray-100 dark:bg-gray-800" />
    </header>
  );
}
