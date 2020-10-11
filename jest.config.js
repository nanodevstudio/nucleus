// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html
const path = require("path");

module.exports = {
  moduleFileExtensions: ["js", "json", "jsx", "ts", "tsx", "node"],
  rootDir: path.join(__dirname, "src"),
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  //testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
};
