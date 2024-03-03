module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    // "^.+\\.(js|jsx)$": "babel-jest" 
  },
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg)$": "identity-obj-proxy"
  }
};