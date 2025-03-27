/**
 * @type {import('lint-staged').Configuration}
 */
export default {
	'*.{cjs,mjs,js,ts,tsx}': ['eslint', 'prettier --write'],
	'*.{css,less}': ['prettier --write'],
	'*.{json,jsonc,html,yml,yaml,md}': ['prettier --write'],
}
