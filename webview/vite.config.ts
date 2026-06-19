import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		dedupe: ['react', 'react-dom'],
	},
	build: {
		outDir: '../dist/webview',
		emptyOutDir: true,
		rollupOptions: {
			output: {
				entryFileNames: 'assets/main.js',
				assetFileNames: 'assets/[name][extname]',
				manualChunks: undefined,
				inlineDynamicImports: true,
			},
		},
		cssCodeSplit: false,
	},
});
