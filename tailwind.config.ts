import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}', 
    // './app/**/*.{js,ts,jsx,tsx,mdx}', 
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Hepta Slab', 'Noto Sans TC', 'sans-serif'],
        'noto-sans': ['Noto Sans TC', 'sans-serif'],
      },
      backgroundImage: {
        'night-image': "url('/images/night.jpg')",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      fontWeight: {
        'light': '300',
        // 'regular': '400',
        'normal': '400',
        'medium': '500',
        'bold': '700'
      },
      mixBlendMode: {
        'color-burn': 'color-burn',
      },
    },
  },
  plugins: [],
}
export default config