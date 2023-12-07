/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com', 'maps.gstatic.com'],
      },
}

// const path = require('path');

// module.exports = {
//   webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
//     // 解決 Web3.js 的窗口對象 (window object) 問題（如果有的話）
//     if (!isServer) {
//       config.resolve.fallback = {
//         fs: false,
//         net: false,
//         tls: false,
//       };
//     }

//     // 在這裡添加更多自定義 webpack 配置

//     return config;
//   },
// };

module.exports = nextConfig
