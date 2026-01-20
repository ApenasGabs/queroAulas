# 📋 Pendências do Projeto QueroAulas

## 🔄 Em Análise / Aguardando Decisão

### 1. Migração para OAuth 2.0 Auth-Code Flow

**Status:** ⏸️ Pausado  
**Razão:** Complexidade inicial vs Simplicidade do Implicit Flow  
**Quando:** Após MVP 1.0 estável  
**O que fazer:**

- Configurar callback endpoint em produção
- Implementar state parameter para CSRF protection
- Adicionar token refresh automático
- Remover Implicit Flow (deprecado pelo Google)

**Prioridade:** ALTA (segurança em produção)  
**Estimativa:** 4-6 horas

**Notas:**

- Auth-Code Flow requer URL de callback fixa no Google Console
- Ideal para produção (tokens nunca expostos ao frontend)
- Implicit Flow será usado temporariamente em dev
- Vercel facilita isso com serverless functions

---

## ✅ Completado

### ✓ Backend Proxy (Express + Google Auth Library)

- Endpoints: exchange, verify, revoke, refresh
- CORS configurado para localhost
- Dotenv para carregar variáveis de ambiente

### ✓ Frontend Integration

- SimpleGoogleLogin com implicit flow
- ApiService para comunicar com backend
- Vite proxy configurado (/api -> localhost:3000)

### ✓ Security Fixes

- Removido console.log com tokens
- Backend valida folder IDs
- Erros sanitizados

---

## 📊 Vulnerabilidades Relacionadas

Veja [SECURITY_AUDIT.md](SECURITY_AUDIT.md#3---oauth-implicit-flow-deprecado) para status completo das vulnerabilidades.

**Críticas associadas a Auth-Code Flow:**

- #3: OAuth Implicit Flow (deprecado) - será resolvido com auth-code
- #8: Token Expiration Handling - será implementado com refresh automático

---

## 🎯 Próximas Etapas (Ordem Recomendada)

1. ✅ Implicit Flow funcionando localmente
2. ⏳ Etapa 2: Hierarquia de pastas (recursão, ordenação)
3. ⏳ Etapa 3: UI/UX (vídeo player, navegação)
4. ⏳ Auth-Code Flow migration
5. ⏳ Etapa 4: Persistência (localStorage, progresso)
6. ⏳ Deploy Vercel com auth-code
