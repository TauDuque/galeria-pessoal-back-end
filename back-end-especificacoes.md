# 🎨 Especificações da API do Back-end

## **Visão Geral**

Este documento especifica as rotas que o back-end deve implementar para integrar com a API do Metropolitan Museum e gerenciar os favoritos dos usuários.

## **🔗 Integração com Metropolitan Museum API**

### **Base URL da API Externa**

```
https://collectionapi.metmuseum.org/public/collection/v1
```

### **Endpoints Utilizados**

- `GET /search` - Buscar obras por critérios
- `GET /objects/{id}` - Obter detalhes de uma obra específica

## **🚀 Rotas da Nossa API**

### **1. Buscar Obras de Arte**

```http
GET /api/artworks
```

**Query Parameters:**

- `page` (number): Página atual (padrão: 1)
- `limit` (number): Limite por página (padrão: 12)
- `filters` (string): Filtros JSON (opcional)

**Exemplo de Response:**

```json
{
  "artworks": [
    {
      "id": "12345",
      "title": "Starry Night",
      "artist": "Vincent van Gogh",
      "date": "1889",
      "medium": "Oil on canvas",
      "department": "European Paintings",
      "imageUrl": "https://...",
      "dimensions": "73.7 x 92.1 cm",
      "culture": "Dutch",
      "period": "19th century",
      "classification": "Paintings",
      "repository": "Metropolitan Museum of Art"
    }
  ],
  "total": 1500,
  "page": 1,
  "hasMore": true
}
```

### **2. Buscar Obra por ID**

```http
GET /api/artworks/:id
```

**Response:** Objeto `MetMuseumArtwork` completo

### **3. Busca com Filtros**

```http
POST /api/artworks/search
```

**Body:**

```json
{
  "filters": {
    "query": "Van Gogh",
    "artist": "Vincent van Gogh",
    "medium": "Oil on canvas"
  },
  "page": 1,
  "limit": 20
}
```

### **4. Obras Clássicas (Destaques)**

```http
GET /api/artworks/classics
```

**Response:** Array de obras clássicas pré-selecionadas

- Deve retornar obras famosas de artistas conhecidos
- Foco em obras com imagens de alta qualidade
- Limite sugerido: 6-12 obras

## **❤️ Sistema de Favoritos**

### **5. Adicionar aos Favoritos**

```http
POST /api/favorites
```

**Body:**

```json
{
  "artworkId": "12345",
  "userId": "user123"
}
```

**Response:**

```json
{
  "id": "favorite123",
  "userId": "user123",
  "artworkId": "12345",
  "createdAt": "2024-01-15T10:30:00Z",
  "artwork": {
    // Objeto MetMuseumArtwork completo
  }
}
```

### **6. Listar Favoritos do Usuário**

```http
GET /api/favorites
```

**Headers:** `Authorization: Bearer {token}`

**Response:**

```json
{
  "items": [
    {
      "id": "favorite123",
      "artworkId": "12345",
      "createdAt": "2024-01-15T10:30:00Z",
      "artwork": {
        // Objeto MetMuseumArtwork completo
      }
    }
  ],
  "total": 5
}
```

### **7. Remover dos Favoritos**

```http
DELETE /api/favorites/:id
```

**Headers:** `Authorization: Bearer {token}`

## **🔄 Fluxo de Integração**

### **1. Carregamento Inicial da Galeria**

1. Front-end chama `GET /api/artworks/classics`
2. Back-end busca obras clássicas da API do Metropolitan Museum
3. Back-end retorna obras com URLs das imagens
4. Front-end exibe obras automaticamente

### **2. Busca de Obras**

1. Usuário digita termo de busca
2. Front-end chama `POST /api/artworks/search`
3. Back-end busca na API do Metropolitan Museum
4. Back-end retorna resultados filtrados
5. Front-end exibe resultados da busca

### **3. Sistema de Favoritos**

1. Usuário clica em "Favoritar" em uma obra
2. Front-end chama `POST /api/favorites`
3. Back-end salva no banco de dados
4. Back-end retorna confirmação
5. Front-end atualiza interface

## **💾 Estrutura do Banco de Dados**

### **Tabela: favorites**

```sql
CREATE TABLE favorites (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  artworkId VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE KEY unique_user_artwork (userId, artworkId)
);
```

### **Tabela: artworks_cache (Opcional)**

```sql
CREATE TABLE artworks_cache (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500),
  artist VARCHAR(255),
  date VARCHAR(100),
  medium VARCHAR(255),
  department VARCHAR(255),
  imageUrl TEXT,
  dimensions VARCHAR(255),
  culture VARCHAR(255),
  period VARCHAR(255),
  classification VARCHAR(255),
  repository VARCHAR(255),
  cachedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## **🔧 Implementação Recomendada**

### **1. Cache Inteligente**

- Implementar cache de obras para reduzir chamadas à API externa
- Cache com TTL (Time To Live) de 24-48 horas
- Busca primeiro no cache, depois na API externa

### **2. Rate Limiting**

- Implementar rate limiting para a API do Metropolitan Museum
- Máximo de 1000 requests por hora por usuário
- Cache para evitar requests duplicados

### **3. Tratamento de Erros**

- Fallback para obras em cache quando API externa falha
- Logs detalhados para debugging
- Retry automático com backoff exponencial

### **4. Validação de Dados**

- Validar IDs de obras antes de salvar favoritos
- Verificar se obra existe na API externa
- Sanitizar dados recebidos da API externa

## **📱 Endpoints do Front-end**

### **Rotas Protegidas (Requerem Autenticação)**

- `POST /api/favorites` - Adicionar favorito
- `GET /api/favorites` - Listar favoritos
- `DELETE /api/favorites/:id` - Remover favorito

### **Rotas Públicas**

- `GET /api/artworks` - Listar obras
- `GET /api/artworks/:id` - Detalhes da obra
- `POST /api/artworks/search` - Buscar obras
- `GET /api/artworks/classics` - Obras clássicas

## **🚀 Próximos Passos**

1. **Implementar rotas básicas** de obras e busca
2. **Configurar integração** com Metropolitan Museum API
3. **Implementar sistema** de favoritos
4. **Adicionar cache** para otimização
5. **Testar integração** completa
6. **Deploy e monitoramento**

---

**Nota:** Esta especificação pode ser expandida conforme necessário. O foco inicial deve ser nas rotas essenciais para o funcionamento básico da aplicação.
