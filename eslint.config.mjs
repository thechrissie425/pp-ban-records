import studio from '@sanity/eslint-config-studio'
import globals from 'globals'

export default [
  {ignores: ['src/sanity.types.*.ts', 'dist/**', '.sanity/**']},
  ...studio,
  {files: ['scripts/**'], languageOptions: {globals: globals.node}},
]
