module.exports = {
  env: {
    'shared-node-browser': true,
    browser: true,
    es6: true,
    node: true
  },
  extends: ['standard'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      impliedStrict: true,
      jsx: false
    },
    ecmaVersion: 8,
    sourceType: 'module'
  },
  plugins: [ 'standard', 'promise' ]

}
