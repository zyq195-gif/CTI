import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue' // 这里是修复的关键点，加上了 plugin-

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 必须配置为你 GitHub 的仓库名，前后都要有斜杠
  base: '/huace/',
})