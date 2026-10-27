import { defineConfig } from 'vite';

export default defineConfig({
  // Static multi-page build for the isolated Vercel test branch.
  // Only explicitly approved public pages become HTML entry points.
  server: {
    host: '0.0.0.0',
    allowedHosts: ['terminal.local'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        en: 'en.html',
        construcao: 'construcao.html',
        facilities: 'facilities.html',
        supply: 'supply.html',
        servicosAdministrativos: 'servicos-administrativos.html',
        credibilidade: 'credibilidade.html',
        rfq: 'rfq.html',
        privacidade: 'privacidade.html',
        termos: 'termos.html',
        catalogoObras: 'catalogo-obras.html',
        sourceAo: 'source-ao/index.html',
        sourceAoPartnerApplication: 'source-ao/partner-application.html',
      },
    },
  },
});
