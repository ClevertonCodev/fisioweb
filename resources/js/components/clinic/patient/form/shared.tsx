export function Req() {
    return <span className="ml-0.5 text-destructive">*</span>;
}

export function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-destructive">{message}</p>;
}
