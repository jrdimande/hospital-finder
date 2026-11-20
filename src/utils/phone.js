export function phoneHref(value) {
  const phone = String(value).trim().replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
  return /\d/.test(phone) ? `tel:${phone}` : null
}
