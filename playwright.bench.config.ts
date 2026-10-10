import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'bench',testMatch:'*.spec.ts',timeout:240_000,workers:1,use:{baseURL:'http://127.0.0.1:4174',viewport:{width:1280,height:900}},webServer:{command:'pnpm exec vite preview --config vite.bench.config.ts --port 4174 --host 127.0.0.1',url:'http://127.0.0.1:4174',reuseExistingServer:!process.env.CI}});
