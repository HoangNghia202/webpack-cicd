import '@testing-library/jest-dom';

Object.assign(globalThis, { __APP_VERSION__: 'test' });
process.env.APP_NAME = 'Webpack Lab (test)';
process.env.API_URL = '/api';
