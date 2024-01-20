module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest", // 處理 TypeScript 檔案
    // "^.+\\.(js|jsx)$": "babel-jest" // 處理 JavaScript 檔案
  },
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg)$": "identity-obj-proxy"
  }
};