import { Skeleton } from '@/components/ui/skeleton';

export function ExerciseCardSkeleton() {
    return (
        <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="mx-3 mt-3 aspect-square overflow-hidden rounded-lg">
                <Skeleton className="h-full w-full rounded-lg" />
            </div>
            <div className="flex items-start justify-between gap-2 p-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-8 flex-shrink-0 rounded-md" />
            </div>
        </div>
    );
}
