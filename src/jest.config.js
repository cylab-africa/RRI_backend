module.exports = {
    testEnvironment: 'node',          // Set the environment to Node.js
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest', // Use Babel to transform JS/TS
    },
    setupFilesAfterEnv: ['./jest.setup.js'],  // Point to the setup file
    moduleFileExtensions: ['js', 'json', 'node'], // Extensions Jest should support
  };
  