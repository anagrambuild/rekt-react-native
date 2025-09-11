// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    plugins: {
      "simple-import-sort": require("eslint-plugin-simple-import-sort"),
    },
    rules: {
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [
            // Polyfills must come first
            ["^\\.\\.?\\/polyfills"],
            // React and React Native
            ["^react$", "^react-native$"],
            // @imports (e.g., @components, @/)
            ["^@components", "^@/"],
            // Other packages
            ["^@?\\w"],
            // Parent imports
            ["^..(?!/?$)", "^../?$"],
            // Other relative imports
            ["^./(?=.*/)(?!/?$)", "^.(?!/?$)", "^./?$"],
            // Style imports
            ["^.+\\.s?css$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      "import/no-named-as-default": "off",
      // Allow require() for polyfills
      "@typescript-eslint/no-var-requires": "off",
      "global-require": "off",
    },
  },
]);
