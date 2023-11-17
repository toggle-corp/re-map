module.exports = {
    extends: ['airbnb', 'airbnb/hooks', 'plugin:@typescript-eslint/recommended', 'plugin:storybook/recommended', 'plugin:storybook/recommended'],
    env: {
        browser: true,
        jest: true,
    },
    plugins: [
        '@typescript-eslint',
    ],
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
        react: {
            version: 'detect',
        },
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        ecmaFeatures: {
            jsx: true,
        },
        sourceType: 'module',
        allowImportExportEverywhere: true,
    },
    rules: {
        strict: 1,
        indent: ['error', 4, { SwitchCase: 1 }],

        'no-unused-vars': 0,
        '@typescript-eslint/no-unused-vars': 1,

        'no-use-before-define': 0,
        '@typescript-eslint/no-use-before-define': 1,

        // note you must disable the base rule as it can report incorrect errors
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': ['error'],

        'import/no-unresolved': ['error'],
        'import/extensions': ['off', 'never'],
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],

        'react/prop-types': 0,
        'react/require-default-props': ['warn', {
            ignoreFunctionalComponents: true,
        }],

        'react/jsx-indent': [2, 4],
        'react/jsx-indent-props': [2, 4],
        'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],

        'import/no-relative-packages': 0,

        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
    },
};
