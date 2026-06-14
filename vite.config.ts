import path from "path"
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function metricsEndpointPlugin(serviceName: string): Plugin {
  const body = [
    '# HELP frontend_up Frontend metrics contract endpoint',
    '# TYPE frontend_up gauge',
    `frontend_up{service="${serviceName}"} 1`,
  ].join('\n') + '\n';

  const handler = (req: any, res: any, next: any) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.end(body);
      return;
    }
    next();
  };

  return {
    name: 'klyb-admin-metrics-endpoint',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    metricsEndpointPlugin('klyb-admin-commu'),
  ],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    allowedHosts: ['host.docker.internal', 'localhost', '127.0.0.1'],
  },
  preview: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    allowedHosts: ['host.docker.internal', 'localhost', '127.0.0.1'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
