# Saúde MZ

Aplicação Vue 3 para localizar hospitais, centros de saúde e postos de saúde em Moçambique. Usa os dados geográficos públicos do MozGIS, Leaflet/OpenStreetMap, geolocalização do navegador e rotas rodoviárias OSRM.

## Executar localmente

```sh
npm ci
npm run dev
```

No desenvolvimento, o Vite encaminha as consultas MozGIS por um proxy local para evitar o bloqueio CORS do navegador.

## Build e GitHub Pages

```sh
npm run build
npm run preview
```

O build consulta as três camadas MozGIS e grava um GeoJSON estático em `public/data/unidades.geojson`. A aplicação publicada lê esse ficheiro do mesmo site, sem depender de CORS do MozGIS no navegador e sem API key. O ficheiro é gerado durante o build e não é versionado.

O workflow `.github/workflows/deploy.yml` valida e publica automaticamente no GitHub Pages após cada push para `main`. Também pode ser executado manualmente no separador **Actions**. Para a primeira publicação, confirme em **Settings → Pages** que a origem está definida como **GitHub Actions**.

O endereço esperado para este repositório é <https://jrdimande.github.io/hospital-finder/>. Os dados são atualizados a cada execução do workflow; a disponibilidade do site não depende de o navegador conseguir contactar diretamente o MozGIS.
