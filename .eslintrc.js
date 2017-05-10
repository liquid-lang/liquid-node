module.exports = {
  env: {
    'shared-node-browser': true,
    browser: true,
    es6: true,
    node: true
  },
  extends: ['standard', 'plugin:import/errors'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      impliedStrict: true,
      jsx: false
    },
    ecmaVersion: 8,
    sourceType: 'module'
  },
  plugins: [ 'standard', 'promise' ],
  rules: {
    'import/extensions': ['error', 'never', {
      coffee: 'always',
      jsx: 'always'
    }],
    'prefer-const': 'error'
  },
  settings: {
    'import/parser': 'babel-eslint'
  }

}
