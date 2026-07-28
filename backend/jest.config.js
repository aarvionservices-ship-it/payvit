module.exports = {
    testEnvironment: "node",
    setupFilesAfterEnv: ["./tests/setup.js"],
    testTimeout: 20000,
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
