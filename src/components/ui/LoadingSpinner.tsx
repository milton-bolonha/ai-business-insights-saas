import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
    return (
        <div className={cn("animate-spin rounded-full border-4 border-gray-100 border-t-sky-600", className)} />
    );
}

export default LoadingSpinner;
