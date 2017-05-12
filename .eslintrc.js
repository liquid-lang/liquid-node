module.exports = {
  env: {
    'shared-node-browser': true,
    browser: true,
    es6: true,
    node: true
  },
  extends: ['standard', 'plugin:import/errors', 'plugin:flowtype/recommended'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      impliedStrict: true,
      jsx: false
    },
    ecmaVersion: 8,
    sourceType: 'module'
  },
  plugins: ['flowtype', 'standard', 'promise' ],
  rules: {
    'import/extensions': ['error', 'never', {
      coffee: 'always',
      jsx: 'always'
    }],
    'prefer-const': 'error'
  },
  settings: {
    flowtype: {
      onlyFilesWithFlowAnnotation: true
    },
    'import/parser': 'babel-eslint'
  }

}
