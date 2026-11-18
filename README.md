# Saúde MZ

Aplicação Vue 3 para localizar hospitais, centros de saúde e postos de saúde em Moçambique. Usa os dados geográficos públicos do MozGIS, Leaflet/OpenStreetMap, geolocalização do navegador e rotas rodoviárias OSRM.

## Executar localmente

```sh
npm ci
npm run dev
```

No desenvolvimento, o Vite encaminha as consultas MozGIS por um proxy local para evitar o bloqueio CORS do navegador.

## Build local

```sh
npm run build
npm run preview
```

O build consulta as três camadas MozGIS e grava um GeoJSON estático em `public/data/unidades.geojson`. A aplicação publicada lê esse ficheiro do mesmo site, sem depender de CORS do MozGIS no navegador e sem API key. O ficheiro é gerado durante o build e não é versionado. Por isso, o serviço MozGIS precisa de estar acessível durante o build.

## Publicar no GitHub Pages

O workflow `.github/workflows/deploy.yml` instala dependências, gera os dados e publica automaticamente após cada push para `master`. Para ativar a primeira publicação:

1. Envie o branch `master` para o GitHub:

   ```sh
   git push origin master
   ```

2. No repositório GitHub, abra **Settings → Pages** e escolha **GitHub Actions** em **Build and deployment → Source**.
3. Abra **Actions** e acompanhe a execução **CI/CD — GitHub Pages**. Quando os trabalhos `build` e `deploy` terminarem com sucesso, o site estará publicado.

Para publicar sem um novo push, abra o mesmo workflow em **Actions → CI/CD — GitHub Pages → Run workflow** e execute-o no branch `master`.

O endereço esperado para este repositório é <https://jrdimande.github.io/hospital-finder/>. Os dados são atualizados a cada execução do workflow; a disponibilidade do site não depende de o navegador conseguir contactar diretamente o MozGIS.
