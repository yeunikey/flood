
interface LoadingProps {
    className?: string
}

function Loading({ className }: LoadingProps) {
    return (
        <div className={className}>
            <div className="rounded-full w-8 h-8 border-blue-700 border-4 border-t-transparent animate-spin" />
        </div>
    );
}

export default Loading;