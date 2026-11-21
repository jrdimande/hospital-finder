# Saúde Perto

**Saúde Perto** é uma aplicação web para localizar hospitais, centros de saúde e postos de saúde em Moçambique.

O projecto reúne dados geográficos públicos num mapa interativo, permite procurar unidades por nome ou localidade, calcular a distância em relação à posição do utilizador e apresentar trajetos a pé, de carro ou de mota.

## Funcionalidades

### Localização e pesquisa

- Pesquisa de unidades pelo nome, tipo, província, distrito ou posto administrativo.
- Sugestões de unidades enquanto o utilizador escreve.
- Pesquisa de localidades e pontos adicionais no OpenStreetMap/Nominatim.
- Localização aproximada do utilizador através do GPS do navegador.
- Acompanhamento opcional da posição em tempo real.
- Ordenação das unidades pela distância até ao utilizador.
- Estados informativos para localização carregada, pesquisa em andamento e ausência de resultados.

### Mapa interativo

- Visualização das unidades num mapa Leaflet.
- Marcadores diferenciados para:
  - Hospitais.
  - Centros de saúde.
  - Postos de saúde.
  - Locais encontrados pelo OpenStreetMap.
  - Posição do utilizador.
- Popups com nome, localização, tipo, fonte e dados adicionais disponíveis.
- Círculo de precisão em torno da posição obtida por GPS.
- Ajuste automático do mapa para apresentar vários resultados ou uma rota completa.
- Links para abrir a unidade no Google Maps.

### Rotas

- Cálculo de trajetos com OSRM/FOSSGIS.
- Modos disponíveis:
  - Peão.
  - Carro.
  - Mota.
- Apresentação da distância aproximada e do tempo estimado.
- Redesenho da rota quando a posição do utilizador muda durante o acompanhamento.
- Tentativa automática de outras unidades próximas caso uma unidade não tenha rota disponível.
- Limpeza e repetição do cálculo da rota.

> O modo de mota usa o perfil rodoviário de carro. A estimativa pode não refletir todas as restrições específicas para motas.

### Informações e reclamações

- Página explicativa sobre fontes, atualização e privacidade.
- Informações sobre a data da última geração dos dados publicados.
- Formulário para comunicar dados incorrectos, problemas no mapa ou rota e problemas técnicos.
- Envio do formulário através do EmailJS.
- Aviso para não incluir dados clínicos nas reclamações.

O projecto é informativo e não integra serviços de emergência, triagem, agendamento ou consulta de resultados clínicos.

## Fontes dos dados

### MozGIS

Os hospitais, centros de saúde e postos de saúde são obtidos das seguintes camadas públicas do MozGIS:

| Camada | Categoria apresentada |
|---|---|
| 5 | Hospital |
| 6 | Centro de saúde |
| 7 | Posto de saúde |

Os dados são normalizados como uma coleção GeoJSON. Uma unidade só é incluída quando possui geometria de ponto, longitude e latitude válidas e propriedades válidas.

### OpenStreetMap

O OpenStreetMap fornece:

- Base cartográfica utilizada pelo Leaflet.
- Pesquisa geográfica através do Nominatim.
- Cálculo de rotas através de OSRM/FOSSGIS.

Os locais encontrados no OpenStreetMap não são automaticamente considerados unidades sanitárias oficiais.

## Tecnologias

- Vue 3
- Vite 6
- Leaflet
- OpenStreetMap
- Nominatim
- OSRM/FOSSGIS
- EmailJS
- GitHub Actions
- GitHub Pages

## Estrutura do projecto

```text
src/
├── components/       Interface reutilizável: navegação, mapa, lista e formulário
├── composables/      Estado de geolocalização e carregamento das unidades
├── services/         MozGIS, pesquisa Nominatim e cálculo de rotas
├── utils/            Cálculo de distâncias e formatação de contactos
├── views/            Páginas principal e informativa
├── App.vue           Navegação por hash
└── main.js           Inicialização da aplicação Vue
scripts/
└── fetch-mozgis-data.js
public/
└── data/             GeoJSON gerado pelo processo de build
```

## Pré-requisitos

- Node.js 22 recomendado.
- npm.
- Acesso à Internet para mapas, pesquisa, rotas e reclamações.
- Permissão de localização do navegador para funções baseadas em GPS.

## Executar localmente

Instale as dependências:

```bash
npm ci
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O Vite utilizará um proxy local para evitar bloqueios CORS quando a aplicação consulta o MozGIS em ambiente de desenvolvimento.

Para aceder à aplicação em modo de produção local:

```bash
npm run build
npm run preview
```

## Configuração do formulário de reclamações

Copie o ficheiro de exemplo:

```bash
cp .env.example .env
```

Configure as variáveis do EmailJS:

```env
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

Quando alguma destas variáveis estiver ausente, o formulário continuará visível, mas informa que o envio está temporariamente indisponível.

Não publique no repositório a chave privada ou credenciais reais de qualquer serviço.

## Geração e utilização dos dados

Durante a construção da aplicação, o script `scripts/fetch-mozgis-data.js` executa `npm run fetch:data` e gera o ficheiro:

```text
public/data/unidades.geojson
```

Esse ficheiro contém:

- Unidade sanitária.
- Categoria.
- Nome.
- Coordenadas.
- Metadados retornados pelo MozGIS.
- Data da geração.

Em produção, o navegador lê o ficheiro estático publicado pela própria aplicação. Assim, o mapa não depende diretamente de uma consulta ao MozGIS no navegador, nem utiliza uma API key.

O MozGIS precisa estar acessível durante o build. A cada publicação é criada uma nova cópia dos dados; não existe uma atualização automática em horário fixo.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Vite. |
| `npm run fetch:data` | Obtém os dados MozGIS e gera o GeoJSON estático. |
| `npm run build` | Atualiza os dados, cria o build e gera a pasta `dist`. |
| `npm run preview` | Inicia localmente o build de produção. |

## Publicação no GitHub Pages

O workflow `.github/workflows/deploy.yml` é executado automaticamente em cada envio para o branch `master` e também pode ser iniciado manualmente.

O processo:

1. Instala as dependências com `npm ci`.
2. Executa o build.
3. Consulta os dados MozGIS.
4. Gera o ficheiro GeoJSON.
5. Cria o artefacto de publicação.
6. Envia o conteúdo para o GitHub Pages.

Para publicar manualmente:

```bash
git push origin master
```

Em seguida, em GitHub Pages, selecione **GitHub Actions** como origem das publicações.

O endereço esperado para este repositório é:

<https://jrdimande.github.io/hospital-finder/>

## Privacidade e localização

- A localização só é solicitada após uma ação do utilizador.
- A posição é usada para calcular distância e trajetos.
- Os dados de localização não são enviados para um servidor próprio.
- A precisão da localização é apresentada no mapa.
- O utilizador pode parar o acompanhamento ou recusar a autorização.

## Limitações

- Os dados podem estar incompletos ou desatualizados.
- Os horários e a disponibilidade das unidades não são fornecidos pela aplicação.
- Um local encontrado no mapa pode não ser uma unidade sanitária oficial.
- Os serviços externos podem ficar temporariamente indisponíveis.
- A precisão do GPS depende do dispositivo e das condições de rede.
- O percurso de mota utiliza o perfil de veículo rodoviário.
- A aplicação não realiza triagem clínica, marcações ou chamadas de emergência.

Confirme sempre os horários, serviços, contactos e disponibilidade diretamente junto da unidade.

## Contribuição

Para alterações no projecto:

1. Crie um branch a partir de `master`.
2. Faça alterações pequenas e verificáveis.
3. Execute `npm run build` antes de enviar.
4. Abra um pull request com uma descrição clara da alteração.

## Licenças e créditos

- Dados sanitários: [MozGIS](https://www.mozgis.gov.mz/)
- Mapa e pesquisa: [OpenStreetMap](https://www.openstreetmap.org/copyright)
- Serviço de rotas: [OSRM/FOSSGIS](https://routing.openstreetmap.de/about.html)
