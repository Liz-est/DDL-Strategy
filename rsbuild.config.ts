import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginLess } from '@rsbuild/plugin-less';
import path from 'path';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  html: {
    template: path.resolve(__dirname, './public/template.html'),
  },
  plugins: [
    pluginReact(),
    pluginLess({
      lessLoaderOptions: {
        lessOptions: {
          plugins: [],
          javascriptEnabled: true,
        },
      },
    }),
  ],
  server: {
		compress: false,  // 解决代理后流式输出失效的问题
		base: '/dify-chat',
    port: 5200,
    proxy: [
      {
				// 代理 Dify API
				target: process.env.DIFY_API_DOMAIN || 'https://api.dify.ai',
        changeOrigin: true,
        context: process.env.DIFY_API_PREFIX || '/v1',
      },
    ],
  },
  tools: {
    postcss: {
      postcssOptions: {
        plugins: [tailwindcss()],
      }
    }
  }
});
