/**
 * VK4WIP brand tokens for RaceTracker — merge into tailwind.config.js `theme.extend`.
 * Source of truth: ipswichradioclub.org.au theme custom-properties.css (v1.2.1).
 *
 * The existing config uses Tailwind-default navy/red/gold scales. Keep the same
 * scale NAMES so current classes keep working, but anchor them on the club values:
 *   navy-900 / primary-900  -> #0B2D53 (club navy)
 *   navy-600 / primary-600  -> #1E5CB3 (club blue)
 *   accent-gold-500 / gold-500 -> #D4AF37 (club gold)
 *   accent-red-600          -> #CC0000 (club red)
 * New code should prefer the flat semantic names (vk-navy, vk-blue, …).
 */
export default {
  colors: {
    // Flat semantic tokens (preferred for new code)
    'vk-navy': '#0B2D53',
    'vk-blue': '#1E5CB3',
    'vk-gold': '#D4AF37',
    'vk-red': '#CC0000',
    'vk-ink': '#222A35',
    'vk-muted': '#5A6579',   // do not lighten: 4.5:1 on white
    'vk-paper': '#F7F8FB',
    'vk-band': '#EEF3FA',
    'vk-border': '#E0E6F0',
    'vk-on-navy': '#E9F2FF',
    'vk-blue-tint': 'rgba(30, 92, 179, 0.10)',
    'vk-gold-tint': 'rgba(212, 175, 55, 0.10)',
    'vk-red-tint': 'rgba(204, 0, 0, 0.10)',

    // Scales re-anchored on club colours (keeps existing class names working)
    navy: {
      50: '#F7F8FB', 100: '#EEF3FA', 200: '#E0E6F0', 300: '#B9CBE6', 400: '#6F96D0',
      500: '#3C72C2', 600: '#1E5CB3', 700: '#174A92', 800: '#103A70', 900: '#0B2D53', 950: '#071D36',
    },
    gold: {
      50: '#FBF7EA', 100: '#F6EDCC', 200: '#EEDC9C', 300: '#E5CA6C', 400: '#DCBB4E',
      500: '#D4AF37', 600: '#B8952A', 700: '#937622', 800: '#6E581A', 900: '#4A3B12', 950: '#2E250B',
    },
    red: {
      50: '#FDF2F2', 100: '#FAD9D9', 200: '#F2A6A6', 300: '#E66B6B', 400: '#D93333',
      500: '#CC0000', 600: '#CC0000', 700: '#A30000', 800: '#7A0000', 900: '#520000', 950: '#330000',
    },
  },
  // In tailwind.config.js also alias:
  //   primary: <navy scale>, 'accent-gold': <gold scale>, 'accent-red': <red scale>
  //   'page-bg': '#F7F8FB', surface: '#FFFFFF'
  fontFamily: {
    display: ['Montserrat', 'system-ui', 'sans-serif'], // headings, bibs, buttons, big times
    sans: ['Inter', 'system-ui', 'sans-serif'],          // body
  },
  borderRadius: {
    chip: '6px',
    btn: '10px',
    card: '12px',
    sheet: '14px',
  },
  boxShadow: {
    btn: '0 2px 10px rgba(0, 0, 0, 0.08)',
    sheet: '0 10px 30px rgba(0, 0, 0, 0.18)',
  },
  minHeight: {
    touch: '44px',
    action: '48px',
    primary: '52px',
  },
};
