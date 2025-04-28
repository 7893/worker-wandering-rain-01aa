export function getCurrentTableName(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
    return `cw_${year}${month}_colors`;
}
