module.exports = {
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '**/*.{json,md,css,scss,mdx}': ['prettier --write'],
}
