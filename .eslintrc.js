module.exports = {
    'extends': [
        'airbnb/base',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
    ],
    'env': {
        'browser': true,
        'jest': true,
    },
    'plugins': [
        'import',
        '@typescript-eslint',
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 2018,
        'ecmaFeatures': {
            'jsx': false,
        },
        'sourceType': 'module',
        'allowImportExportEverywhere': true,
    },
    'settings': {
        'import/resolver': {
            'node': {
                'extensions': ['.js', '.ts', '.tsx', '.jsx'],
            },
        },
    },
    'rules': {
        'strict': 0,
        'indent': ['error', 4, { 'SwitchCase': 1 }],
        'no-unused-vars': [1, { 'vars': 'all', 'args': 'after-used', 'ignoreRestSiblings': false }],
        'no-console': 0,

        'import/extensions': ['off', 'never'],
        'import/no-extraneous-dependencies': ['error', {'devDependencies': true }],

        'prefer-destructuring': 'warn',
        'function-paren-newline': ['warn', 'consistent'],
        'object-curly-newline': [2, {
            'ObjectExpression': { 'consistent': true },
            'ObjectPattern': { 'consistent': true },
            'ImportDeclaration': { 'consistent': true },
            'ExportDeclaration': { 'consistent': true },
        }],

        '@typescript-eslint/no-empty-interface': 0,
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/camelcase': 0,
    },
};
