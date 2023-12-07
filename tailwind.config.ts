import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // 更新路徑到 src/pages
    './src/components/**/*.{js,ts,jsx,tsx,mdx}', // 更新路徑到 src/components
    // './app/**/*.{js,ts,jsx,tsx,mdx}', // 這行可以刪除，因為 app 目錄已經不存在了
    './src/**/*.{js,ts,jsx,tsx}', // 額外添加這行以包括 src 下的所有相關檔案
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