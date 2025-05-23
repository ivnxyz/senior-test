import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusBadgeClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-500 hover:bg-green-500/90 text-white hover:text-white";
    case "IN_PROGRESS":
      return "bg-yellow-500 hover:bg-yellow-500/90 text-white hover:text-white";
    case "PENDING":
      return "bg-blue-500 hover:bg-blue-500/90 text-white hover:text-white";
    case "CANCELLED":
      return "bg-red-500 hover:bg-red-500/90 text-white hover:text-white";
    default:
      return "";
  }
}