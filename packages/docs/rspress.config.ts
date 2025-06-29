import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
	root: path.join(__dirname, 'docs'),
	title: 'Dify Chat 文档',
	icon: '/rspress-icon.png',
	// logo: {
	// 	light: '/rspress-light-logo.png',
	// 	dark: '/rspress-dark-logo.png',
	// },
	builderConfig: {
		server: {
			// 指定启动端口
			port: 6200,
		},
	},
	themeConfig: {
		socialLinks: [
			{
				icon: 'github',
				mode: 'link',
				content: 'https://github.com/web-infra-dev/rspress',
			},
		],
	},
});
