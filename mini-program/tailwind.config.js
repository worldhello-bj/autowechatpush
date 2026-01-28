/** @type {import('tailwindcss').Config} */
module.exports = {
  // We specify the content paths for Tailwind to purge unused styles
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    // Disable preflight to avoid conflict with WeChat default styles
    preflight: false,
  },
}
