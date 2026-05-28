export function Req() {
    return <span className="text-destructive ml-0.5">*</span>;
}

export function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-destructive mt-1 text-xs">{message}</p>;
}
