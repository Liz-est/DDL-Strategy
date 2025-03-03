import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginLess } from '@rsbuild/plugin-less';
import path from 'path';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  source: {
    define: {
      'process.env.DIFY_API_KEY': JSON.stringify(process.env.DIFY_API_KEY),
      'process.env.DIFY_API_BASE': JSON.stringify(process.env.DIFY_API_BASE),
      'process.env.DIFY_API_VERSION': JSON.stringify(process.env.DIFY_API_VERSION),
    }
  },
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
				target: process.env.DIFY_API_BASE || 'https://api.dify.ai',
        changeOrigin: true,
        context: process.env.DIFY_API_VERSION || '/v1',
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
