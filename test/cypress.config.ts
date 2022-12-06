import { defineConfig } from 'cypress';
import fs from 'fs';

export default defineConfig({
  video: false,
  projectId: 'wmnjof',
  viewportWidth: 1000,
  viewportHeight: 950,
  fixturesFolder: 'test/cypress/fixtures',
  screenshotsFolder: 'test/cypress/screenshots',
  videosFolder: 'test/cypress/videos',
  defaultCommandTimeout: 5000,
  pageLoadTimeout: 90000,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    baseUrl: 'http://localhost:8080/#',
    supportFile: 'test/cypress/support/index.js',
    specPattern: 'test/cypress/e2e/**/*.{js,ts}',
    excludeSpecPattern: process.env.CI ? ['**/node_modules/**', '**/000-*.cy.{js,ts}'] : ['**/node_modules/**'],
    setupNodeEvents(on, config) {
      on('task', {
        updateListOfTests() {
          const UPDATE_TESTS_LIST_CY_JS = '000-update-tests-list.cy.js';
          const RUN_ALL_TESTS_CY_JS = '000-run-all-specs.cy.js';
          const PATHNAME_OF_RUN_ALL_TESTS_CY_JS = './cypress/e2e/' + RUN_ALL_TESTS_CY_JS;

          const testsOnDisk = fs
            .readdirSync('./cypress/e2e/')
            .filter(filename => filename.endsWith('.cy.js'))
            .filter(
              filename =>
                ![UPDATE_TESTS_LIST_CY_JS, RUN_ALL_TESTS_CY_JS].includes(filename)
            );
          const scriptImportingAllTests =
            `// This script was autogenerated by ${UPDATE_TESTS_LIST_CY_JS}\n` +
            testsOnDisk.map(test => `import "./${test}"`).join('\n');
          fs.writeFileSync(
            PATHNAME_OF_RUN_ALL_TESTS_CY_JS,
            scriptImportingAllTests
          );
          return true;
        },
      });
      return require('./cypress/plugins/index.js')(on, config);
    },
  },
});