import { cn } from "@/shared/model/utils";

interface LoadingProps {
    className?: string
}

function Loading({ className }: LoadingProps) {
    return (
        <div className={cn('relative', className)}>
            <div className="absolute rounded-full w-10 h-10 border-[#497ab3] border-6 border-t-transparent animate-spin" />
            <div className="absolute rounded-full w-10 h-10 border-[#497ab3] border-6 opacity-5" />
        </div>
    );
}

export default Loading;