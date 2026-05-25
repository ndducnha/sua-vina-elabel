export function formatLotSerialDisplay(serial: string): string {
  const normalized = serial.trim()
  if (/^\d{7}$/.test(normalized)) {
    const year = normalized.substring(0, 4)
    const seq = normalized.substring(4, 7)
    return `LOT - ${year}-${seq}`
  }
  if (!normalized.toUpperCase().startsWith('LOT')) {
    return `LOT - ${normalized}`
  }
  return normalized
}
