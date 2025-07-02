// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    plugins: {
      'simple-import-sort': require('eslint-plugin-simple-import-sort'),
    },
    rules: {
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            // React and React Native first
            ['^react$', '^react-native$'],
            // @imports (e.g., @components, @/)
            ['^@components', '^@/'],
            // Other packages
            ['^@?\\w'],
            // Parent imports
            ['^..(?!/?$)', '^../?$'],
            // Other relative imports
            ['^./(?=.*/)(?!/?$)', '^.(?!/?$)', '^./?$'],
            // Style imports
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
]);
