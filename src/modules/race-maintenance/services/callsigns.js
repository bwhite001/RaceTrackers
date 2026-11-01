/** "vk4mud, VK4MKD  vk4ear" -> ['VK4MUD','VK4MKD','VK4EAR'] (commas or spaces, non-callsign tokens like "(JOHN)" dropped, de-duplicated, order kept). */
export const parseCallsigns = (text) => [...new Set(String(text ?? '').toUpperCase().split(/[\s,]+/).filter(t => /^[A-Z0-9/-]+$/.test(t)))];
