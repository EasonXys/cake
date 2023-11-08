import { defineConfig } from "vite";
import path, { resolve } from 'path'
import uni from "@dcloudio/vite-plugin-uni";
// import sass from 'vite-plugin-sass'
import nodeResolve from '@rollup/plugin-node-resolve';

const PORT = 8080

/** 路径查找 */
const pathResolve = (dir: string): string => {
  return resolve(__dirname, ".", dir);
};

let publicPath = './'
const BUILD_ENV = process.env.BUILD_ENV;
if (BUILD_ENV === 'prod') {
  publicPath = '//easonxys.github.io/cake'
}
console.log(BUILD_ENV)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       implementation: sass,
  //     }
  //   }
  // },
  base: publicPath,
  build: {
    sourcemap: false,
    // 消除打包大小超过500kb警告
    chunkSizeWarningLimit: 4000,
    assetsDir: 'public',
    rollupOptions: {
      input: {
        index: pathResolve("index.html")
      },
      // 静态资源分类打包
      output: {
        chunkFileNames: "static/js/[name]-[hash].js",
        entryFileNames: "static/js/[name]-[hash].js",
        assetFileNames: "static/[ext]/[name]-[hash].[ext]",
      },
      plugins: [
        nodeResolve({
          extensions: ['.mp3', '.json', '.shard'],
          alias: {
            'src': resolve(__dirname, 'src')
          }
        })
      ]
    }
  },
  server: {
    port: PORT,
    host: "localhost",
    strictPort: true,
    cors: true,
    proxy: {
    },
    hmr: {
      clientPort: PORT,
      host: "localhost"
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, 'src')
    }
  },
});
