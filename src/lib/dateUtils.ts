export function getGroupLabel(timestamp: number | string): string {
    const date = new Date(timestamp);
    const now = new Date();

    // Normalize to start of day for comparison
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfLastWeek = new Date(startOfToday);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const startOfLastMonth = new Date(startOfToday);
    startOfLastMonth.setDate(startOfLastMonth.getDate() - 30);

    if (date >= startOfToday) {
        return 'Today';
    }

    if (date >= startOfYesterday) {
        return 'Yesterday';
    }

    if (date >= startOfLastWeek) {
        return 'Previous 7 Days';
    }

    if (date >= startOfLastMonth) {
        return 'Previous 30 Days';
    }

    return 'Older';
}
