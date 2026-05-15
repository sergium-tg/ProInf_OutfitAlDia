module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // ESTA ES LA LÍNEA CLAVE PARA ARREGLAR EL ERROR 403 Y EL FALLO DE PRISMA
  setupFiles: ['dotenv/config'], 
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.test.{ts,js}',
  ],
};