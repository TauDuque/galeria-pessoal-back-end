# Exemplos de Busca na API

Este arquivo contém exemplos práticos de como usar os diferentes parâmetros de busca na API.

## Exemplos Básicos

### 1. Busca por Artista

```bash
curl "http://localhost:3000/api/artworks/search?artist=Van%20Gogh&limit=10"
```

### 2. Busca por Departamento

```bash
curl "http://localhost:3000/api/artworks/search?department=Paintings&limit=20"
```

### 3. Busca por Período

```bash
curl "http://localhost:3000/api/artworks/search?period=Impressionism&limit=15"
```

## Exemplos Avançados

### 4. Combinação de Título e Artista

```bash
curl "http://localhost:3000/api/artworks/search?title=Starry%20Night&artist=Van%20Gogh&limit=25"
```

### 5. Busca por Título Específico

```bash
curl "http://localhost:3000/api/artworks/search?title=Sunflowers&limit=30"
```

### 6. Busca por Artista com Limite

```bash
curl "http://localhost:3000/api/artworks/search?artist=Monet&limit=20"
```

### 7. Busca Case Insensitive (Funciona com qualquer case)

```bash
# Todas essas buscas funcionam da mesma forma:
curl "http://localhost:3000/api/artworks/search?artist=Monet&limit=10"
curl "http://localhost:3000/api/artworks/search?artist=monet&limit=10"
curl "http://localhost:3000/api/artworks/search?artist=MONET&limit=10"
curl "http://localhost:3000/api/artworks/search?artist=MoNeT&limit=10"
```

## Exemplos com JavaScript/Fetch

### Busca Simples

```javascript
const searchArtworks = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/artworks/search?${params}`);
  return response.json();
};

// Uso
const results = await searchArtworks({
  artist: "Van Gogh",
  period: "Impressionism",
  limit: 15,
});
```

### Busca Combinando Título e Artista

```javascript
const searchWithTitleAndArtist = async () => {
  const filters = {
    title: "Starry Night",
    artist: "Van Gogh",
    limit: 30,
  };

  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/artworks/search?${params}`);
  return response.json();
};
```

## Dicas de Uso

1. **Combine título e artista** para obter resultados mais específicos
2. **Use apenas um filtro** para buscas mais amplas
3. **O parâmetro `limit`** pode ser ajustado de 1 a 50
4. **Busque por título parcial** para encontrar obras similares
5. **Use o nome completo do artista** para resultados mais precisos
6. **Case insensitive**: A API funciona independentemente de maiúsculas/minúsculas
7. **Normalização automática**: Todos os parâmetros são convertidos para lowercase
8. **Tratamento inteligente de erros**: Diferencia entre "não encontrado" e "erro real"

## Resposta da API

Todas as buscas retornam um objeto com:

- `artworks`: Array com as obras encontradas
- `total`: Número total de obras encontradas
- `searchQuery`: Query construída pela API
- `appliedFilters`: Filtros aplicados na busca
- `limit`: Limite usado na busca

## Tratamento de Erros

### Obra Não Encontrada (Status 200)

Quando nenhuma obra é encontrada, a API retorna status 200 com uma mensagem amigável:

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

### Erro na API do Met (Status 500)

Quando há um problema real na API do Metropolitan Museum:

```json
{
  "message": "Erro na API do Metropolitan Museum of Art",
  "details": "Erro na API do Met: 500 - Internal Server Error"
}
```

### Erro Interno do Servidor (Status 500)

Para problemas internos da aplicação:

```json
{
  "message": "Erro interno do servidor"
}
```
