# Galeria de Arte Pessoal - Backend

API para gerenciar uma galeria de arte pessoal, integrada com a API do Metropolitan Museum of Art (Met).

## Funcionalidades

- Busca de obras de arte na API do Met
- Salvamento de obras favoritas no banco de dados
- Gerenciamento de coleção pessoal
- Autenticação de usuários

## Endpoints

### Busca de Obras de Arte

**GET** `/api/artworks/search`

Busca obras de arte na API do Met usando filtros avançados.

#### Parâmetros de Busca

A API aceita os seguintes parâmetros como filtro de busca:

| Parâmetro | Descrição       | Exemplo             |
| --------- | --------------- | ------------------- |
| `title`   | Título da obra  | `?title=Sunflowers` |
| `artist`  | Nome do artista | `?artist=Van Gogh`  |

#### Parâmetros Adicionais

| Parâmetro | Descrição                   | Padrão | Máximo |
| --------- | --------------------------- | ------ | ------ |
| `limit`   | Número máximo de resultados | 20     | 50     |

#### Exemplos de Uso

**Busca simples por artista:**

```
GET /api/artworks/search?artist=Van Gogh&limit=10
```

**Busca por título:**

```
GET /api/artworks/search?title=Sunflowers&limit=15
```

**Busca por artista:**

```
GET /api/artworks/search?artist=Van Gogh&limit=25
```

**Busca combinando título e artista:**

```
GET /api/artworks/search?title=Starry Night&artist=Van Gogh&limit=30
```

#### Resposta

```json
{
  "artworks": [...],
  "total": 15,
  "searchQuery": "artist:van gogh",
  "appliedFilters": {
    "artist": "Van Gogh"
  },
  "normalizedValues": {
    "artist": "van gogh"
  },
  "limit": 15
}
```

#### Normalização Automática

A API automaticamente converte todos os parâmetros de busca para lowercase para evitar problemas de case sensitivity. Por exemplo:

- `?artist=Monet` será convertido para `artist:monet`
- `?title=Starry Night` será convertido para `title:starry night`

#### Tratamento de Erros

A API diferencia entre diferentes tipos de situação:

**Obra não encontrada (Status 200):**

```json
{
  "artworks": [],
  "total": 0,
  "message": "Nenhuma obra encontrada para: artist:monet",
  "searchQuery": "artist:monet",
  "appliedFilters": { "artist": "Monet" },
  "normalizedValues": { "artist": "monet" }
}
```

**Erro na API do Met (Status 500):**

```json
{
  "message": "Erro na API do Metropolitan Museum of Art",
  "details": "Erro na API do Met: 500 - Internal Server Error"
}
```

**Erro interno do servidor (Status 500):**

```json
{
  "message": "Erro interno do servidor"
}
```

### Outros Endpoints

#### **Obras de Arte (Públicas)**

**GET** `/api/artworks` - Listar obras com paginação
**GET** `/api/artworks/classics` - Obras clássicas/destaques
**GET** `/api/artworks/:id` - Detalhes de uma obra específica

#### **Coleção Pessoal (Protegidas)**

**POST** `/api/artworks/save` - Salvar obra na coleção pessoal
**GET** `/api/artworks/user` - Listar obras da coleção pessoal
**DELETE** `/api/artworks/:artworkId` - Remover obra da coleção

#### **Sistema de Favoritos (Protegidas)**

**POST** `/api/favorites` - Adicionar obra aos favoritos
**GET** `/api/favorites` - Listar favoritos do usuário
**DELETE** `/api/favorites/:favoriteId` - Remover dos favoritos

## Instalação

```bash
npm install
npm run dev
```

## Tecnologias

- Node.js
- Express
- Prisma
- TypeScript
- API do Metropolitan Museum of Art
