import reactCompiler from 'eslint-plugin-react-compiler'
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  reactRefresh.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    }
  },
  {
    plugins: {
      'eslint-plugin-react': react
    },
  },
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
);
