export function toCsv(rows: Array<Array<string | number | null>>): string {
  return rows
    .map((row) => row.map((value) => {
      const text = value == null ? '' : String(value)
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
    }).join(','))
    .join('\r\n')
}
