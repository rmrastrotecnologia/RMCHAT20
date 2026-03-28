# 🚀 Cloudflare Workers Migration Guide

## Status da Refatoração

Este documento descreve o que foi feito e o que ainda precisa ser completado para migrar o backend para Cloudflare Workers.

## ✅ Concluído

- [x] Atualizado `package.json` - removidas dependências incompatíveis
- [x] Reescrito `wrangler.toml` - configuração completa para Workers
- [x] Criado novo `server.ts` com Hono Framework
- [x] Implementado `WebSocketDurableObject` para substituir Socket.io
- [x] Criado adaptador `D1` para banco de dados
- [x] Configurado TypeScript para Cloudflare Workers
- [x] Estrutura básica de rotas com Hono

## ⏳ Próximos Passos

### 1. Refatorar Controllers (ALTO PRIORIDADE)

Todos os controllers em `src/controllers/` precisam ser reescritos para usar Hono em vez de Express:

```typescript
// ANTES (Express):
export const create = async (req: Request, res: Response) => {
  const data = req.body;
  res.json(data);
};

// DEPOIS (Hono):
export const create = async (c: Context) => {
  const data = await c.req.json();
  return c.json(data);
};
```

**Arquivos afetados:**
- `src/controllers/*Controller.ts` (30+ arquivos)

### 2. Refatorar Serviços

Os serviços em `src/services/` precisam ser adaptados para D1 em vez de Sequelize:

```typescript
// ANTES (Sequelize):
const user = await User.findByPk(id);

// DEPOIS (D1):
const user = await db.findOne("users", { id });
```

**Arquivos afetados:**
- `src/services/**/*.ts` (múltiplos serviços)

### 3. Migrar Modelos

Os modelos Sequelize precisam ser convertidos para simples interfaces/tipos:

```typescript
// ANTES:
export default class User extends Model {}

// DEPOIS:
export interface User {
  id: number;
  name: string;
  email: string;
  // ...
}
```

### 4. Remover Dependências de Socket.io

Qualquer código que use `getIO()` ou `socket.emit()` precisa usar o Durable Object:

```typescript
// Substituir getIO() com chamadas ao Durable Object
const wsObject = env.WS_NAMESPACE.get(id);
await wsObject.fetch(request);
```

### 5. Implementar Filas com Cloudflare Queues

Substituir Bull + Redis com Cloudflare Queues:

**Exemplo de envio:**
```typescript
const queue = c.env.QUEUE;
await queue.send({ 
  type: "send_message",
  ticketId: "123"
});
```

### 6. Configurar D1 Database

1. Criar banco de dados D1:
   ```bash
   wrangler d1 create rmboot --local
   ```

2. Executar migrações SQL (converter do Sequelize):
   ```bash
   wrangler d1 execute rmboot --file=./src/database/schema.sql
   ```

### 7. Configurar Variáveis de Ambiente

No `wrangler.toml`, adicionar secrets:
```bash
wrangler secret put JWT_SECRET --env production
wrangler secret put OPENAI_API_KEY --env production
```

### 8. Testes e Deployment

- Testes locais: `wrangler dev`
- Deploy: `wrangler deploy --env production`

## 📋 Checklist de Migração

- [ ] Refatorar todos os 30+ controllers
- [ ] Refatorar todos os serviços
- [ ] Converter modelos Sequelize → Tipos TS
- [ ] Remover todas as dependências de Socket.io
- [ ] Implementar Cloudflare Queues para filas
- [ ] Configurar D1 com schema SQL correto
- [ ] Converter migrações Sequelize → SQL
- [ ] Implementar autenticação JWT com jose
- [ ] Configurar R2 para upload de arquivos
- [ ] Testar endpoints principais localmente
- [ ] Preparar variáveis de produção
- [ ] Deploy inicial em staging
- [ ] Testes de carga e performance
- [ ] Deploy em produção

## 🔧 Tecnologias

| Antes | Depois |
|-------|--------|
| Express.js | Hono |
| Socket.io | Durable Objects |
| Sequelize + MySQL/PG | D1 (SQLite) |
| Bull + Redis | Cloudflare Queues |
| Node.js | Cloudflare Workers |
| JWT com jsonwebtoken | jose |

## 📝 Notas Importantes

1. **D1 é SQLite**: As queries SQL são ligeiramente diferentes
2. **Sem persistência de conexão**: Não há conexões socket persistentes nativas
3. **Rate limiting**: Implementar via Durable Objects ou Workers Analytics
4. **Uploads**: Usar R2 em vez de salvar localmente
5. **Cron jobs**: Usar Cloudflare Cron Workers
6. **Email**: Integrar com Resend.dev ou Mailgun

## 🚨 Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Perda de dados durante migração | Manter ambiente antigo durante transição |
| Incompatibilidade de API | Versionar endpoints |
| Performance reduzida | Testar carga antes de produção |

## 📞 Suporte

Para dúvidas sobre Cloudflare Workers:
- Documentação: https://developers.cloudflare.com/workers/
- Durable Objects: https://developers.cloudflare.com/durable-objects/
- D1: https://developers.cloudflare.com/d1/
- Hono: https://hono.dev/
