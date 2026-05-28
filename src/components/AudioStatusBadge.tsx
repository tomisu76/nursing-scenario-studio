export function AudioStatusBadge({ status }: { status: string }) { return <span className={`badge ${status}`}>{status}</span>; }
