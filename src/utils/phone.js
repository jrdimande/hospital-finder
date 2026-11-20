export function extractPhoneNumbers(value) {
  if (value === null || value === undefined) return []

  const text = String(value)
  const matches = text.match(/\+?\s*(?:258\s*)?(?:[0-9][0-9 ().-]{6,13}[0-9])/g) || []

  return [...new Set(matches
    .map((match) => match.replace(/[^0-9+]/g, '').replace(/^\+/, ''))
    .filter((digits) => digits.length >= 7 && digits.length <= 15)
    .map((digits) => {
      if (digits.startsWith('258')) return `+${digits}`
      if (digits.length === 9 && /^[289]/.test(digits)) return `+258${digits}`
      if (digits.length === 8) return `+258${digits}`
      return `+${digits}`
    }))]
}
