# 🚀 Guia Rápido - Começar a Usar o Backend Refatorado

Este guia ajudará você a começar com o novo backend baseado em Cloudflare Workers.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- `wrangler` CLI instalado: `npm install -g @cloudflare/wrangler`
- Conta Cloudflare (grátis funciona para desenvolvimento local)

## 🛠️ Configuração Inicial

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar arquivo `.env.local` (para desenvolvimento)

```bash
# .env.local (não versionar!)
JWT_SECRET=seu-super-secret-key-aqui-mude-em-producao
OPENAI_API_KEY=sua-chave-openai-aqui
ENVIRONMENT=development
LOG_LEVEL=debug
FRONTEND_URL=http://localhost:3000
```

### 3. Criar banco de dados D1 localmente

```bash
# Criar banco de dados local
wrangler d1 create rmboot --local

# Executar schema
wrangler d1 execute rmboot --local --file=src/database/schema.sql
```

## 🧪 Testes Locais

### Ver logs em tempo real
```bash
npm run dev
```

A API estará disponível em: `http://localhost:8787/api`

### Testar endpoints com cURL

**1. Signup (criar conta)**
```bash
curl -X POST http://localhost:8787/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "name": "Admin User",
    "companyName": "Minha Empresa"
  }'
```

**Resposta esperada:**
```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "profile": "admin",
    "companyId": 1,
    "online": true,
    "createdAt": "2026-03-28T10:30:00.000Z"
  },
  "company": {
    "id": 1,
    "name": "Minha Empresa",
    "status": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiI...",
  "refreshToken": "eyJhbGciOiJIUzI1NiI..."
}
```

**2. Login**
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

**3. Listar usuários (requer token)**
```bash
curl -X GET http://localhost:8787/api/users \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**4. Criar novo usuário**
```bash
curl -X POST http://localhost:8787/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "email": "agent@example.com",
    "password": "password123",
    "name": "Agent User",
    "profile": "agent",
    "companyId": 1
  }'
```

## 📦 Build para Produção

```bash
# Build TypeScript
npm run build

# Deploy para staging
wrangler deploy --env development

# Deploy para produção
wrangler deploy --env production
```

## 🔑 Configurar Secrets em Produção

```bash
# Adicionar secrets da Cloudflare
wrangler secret put JWT_SECRET --env production
wrangler secret put OPENAI_API_KEY --env production
```

## 📊 Estructura do Novo Backend

```
src/
├── @types/          # Type definitions
├── config/          # Configurações (D1, auth, etc)
├── controllers/     # Controladores da API (refatorados)
│   ├── UserController.ts      ✅ Refatorado
│   ├── AuthController.ts      ✅ Novo
│   └── ...outras rotas        ⏳ TODO
├── database/        # Schema SQL, seeds
├── durable-objects/ # Lógica de WebSocket
├── errors/          # Classes de erro
├── helpers/         # Funções auxiliares
├── middleware/      # Middleware (auth, etc)
├── models/          # Type definitions
├── routes/          # Rotas (refatoradas para Hono)
│   ├── authRoutes.ts          ✅ Refatorada
│   ├── userRoutes.ts          ✅ Refatorada
│   └── index.ts               ✅ Refatorada
├── services/        # Lógica de negócio      ⏳ TODO: Adaptar
├── utils/           # Utilitários
├── app.ts           ✅ Removido (integrado em server.ts)
├── bootstrap.ts     ✅ Adaptado
├── index.ts         ✅ Novo (entry point)
└── server.ts        ✅ Novo (Hono + Workers)

wrangler.toml       ✅ Refatorado
package.json        ✅ Refatorado
tsconfig.json       ✅ Refatorado
```

## 🔄 Fluxo de Autenticação

1. **Signup**: Cria empresa + admin user
2. **Login**: Retorna JWT token + refresh token
3. **Protected Routes**: Validam token via middleware `authMiddleware`
4. **Refresh Token**: Gera novo access token sem alterar refresh token

## 🌐 Endpoints Implementados

### ✅ Já Refatorados
- `POST /api/auth/signup` - Criar conta
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/refresh-token` - Renovar token
- `DELETE /api/auth/logout` - Fazer logout
- `GET /api/auth/me` - Dados do usuário atual
- `GET /api/users` - Listar usuários (com paginação)
- `POST /api/users` - Criar usuário
- `GET /api/users/:userId` - Ver usuário
- `PUT /api/users/:userId` - Atualizar usuário
- `DELETE /api/users/:userId` - Deletar usuário
- `GET /api/users/list` - Lista simples (para dropdowns)

### ⏳ TODO - Próximas Rotas
- Tickets
- Contacts
- Messages
- WhatsApp
- Queues
- Campaigns
- Dashboard
- ... e mais

## 🐛 Debugging

### Ver logs
```bash
npm run dev
# Abra http://localhost:8787 no navegador
```

### Ver banco de dados D1
```bash
wrangler d1 execute rmboot --local --command "SELECT * FROM users;"
```

### Limpar banco local
```bash
rm database/db.sqlite
```

## 📱 Testar com Insomnia/Postman

Importe o arquivo `postman-collection.json` (veja como criar abaixo):

1. Criar nova collection
2. Adicionar requisição POST: `http://localhost:8787/api/auth/signup`
3. Body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "test123",
  "name": "Test User",
  "companyName": "Test Company"
}
```
4. Salvar response no environment como `TOKEN`
5. Usar `{{TOKEN}}` em Authorization header das próximas requisições

## ⚠️ Limitações Conhecidas

1. **D1 é SQLite**: Algumas queries SQL avançadas podem não funcionar
2. **Sem conexões persistentes**: WebSocket não é nativo, usa Durable Objects
3. **Max 20 mensagens/segundo**: Rate limit do Cloudflare
4. **Timeout 30s**: Máximo de tempo por requisição

## 🆘 Troubleshooting

**Erro: "Cannot find module 'hono'"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Erro: "D1 database not found"**
```bash
wrangler d1 create rmboot --local
wrangler d1 execute rmboot --local --file=src/database/schema.sql
```

**Erro: "JWT_SECRET not set"**
```bash
# Adicionar a meio.env.local:
JWT_SECRET=sua-chave-secretaria
```

## 📚 Próximos Passos

1. Refatorar todos os outros controllers (veja exemplo em `CONTROLLER_MIGRATION_EXAMPLE.ts`)
2. Adaptar serviços para usar D1 em vez de Sequelize
3. Implementar upload de arquivos (R2)
4. Configurar Cloudflare Queues para jobs
5. Deploy initial em staging
6. Testes de carga

## 📞 Documentação

- Hono: https://hono.dev/
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- D1: https://developers.cloudflare.com/d1/
- Durable Objects: https://developers.cloudflare.com/durable-objects/
- jose (JWT): https://github.com/panva/jose
