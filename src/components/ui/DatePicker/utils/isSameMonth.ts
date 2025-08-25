export function isSameMonth(date: Date, comparison: Date) {
    if (!date || !comparison) return false
    return (
        date.getFullYear() === comparison.getFullYear() &&
        date.getMonth() === comparison.getMonth()
    )
}
