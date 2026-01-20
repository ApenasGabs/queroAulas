# 🔐 Auditoria de Segurança - QueroAulas

**Data:** 20 de janeiro de 2026  
**Versão:** MVP Etapa 1  
**Auditor:** GitHub Copilot  
**Status:** Em Desenvolvimento

---

## 📊 Resumo Executivo

| Severidade | Quantidade | Status |
|------------|------------|--------|
| 🔴 Crítica | 4 | ⏳ Pendente |
| 🟠 Alta    | 4 | ⏳ Pendente |
| 🟡 Média   | 4 | ⏳ Pendente |
| ⚪ Baixa   | 2 | ⏳ Pendente |
| **Total**  | **14** | **0% Resolvido** |

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. Exposição de Access Tokens no Console

**CWE:** CWE-532 (Insertion of Sensitive Information into Log File)  
**CVSS Score:** 8.1 (High)

#### Descrição

Access tokens OAuth são logados em texto plano no console do navegador, tornando-os vulneráveis a captura por:

- Extensões maliciosas do navegador
- DevTools abertos durante screen sharing
- Scripts de terceiros com acesso ao console
- Malware com acesso ao processo do navegador

#### Localização

```typescript
// src/components/SimpleGoogleLogin.tsx:20-21
console.log("[GoogleLogin] access_token", codeResponse.access_token);

// src/components/SimpleGoogleLogin.tsx:53-54
console.log("[GoogleLogin] storing access_token:", 
  codeResponse.access_token.substring(0, 20) + "...");

// src/services/driveServiceOAuth.ts:40-43
console.log("[driveService] listFolderContents called", {
  folderId,
  hasAccessToken: !!accessToken,
  tokenStart: accessToken?.substring(0, 20) + "...",
});
```

#### Impacto

- **Confidencialidade:** ALTA - Tokens permitem acesso completo ao Drive do usuário
- **Integridade:** MÉDIA - Atacante pode modificar/excluir arquivos
- **Disponibilidade:** BAIXA - Não afeta diretamente

#### Exploração

```javascript
// Extensão maliciosa pode capturar:
const originalLog = console.log;
console.log = function(...args) {
  if (args[0]?.includes('access_token')) {
    sendToAttacker(args);
  }
  originalLog.apply(console, args);
};
```

#### Solução

**Imediata:**

```typescript
// Remover TODOS os console.log com tokens
// Use apenas em desenvolvimento com flag:
if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_TOKENS === 'true') {
  console.log("[DEBUG] token:", token.substring(0, 10) + "***");
}
```

**Longo prazo:**

- Implementar sistema de logging estruturado
- Sanitizar logs automaticamente
- Usar Sentry/LogRocket com redaction de tokens

#### Status

⏳ **Pendente** - Prioridade máxima antes de produção

---

### 2. Access Token Armazenado em Memória Sem Proteção

**CWE:** CWE-312 (Cleartext Storage of Sensitive Information)  
**CVSS Score:** 7.5 (High)

#### Descrição

Access tokens armazenados em plain text no React state podem ser acessados através de:

- React DevTools Extension
- Inspeção de memória via debugger
- XSS que injete código no contexto da aplicação

#### Localização

```typescript
// src/contexts/GoogleAuthContext.tsx:53
const [accessToken, setAccessTokenState] = useState<string | null>(null);
```

#### Impacto

- **Confidencialidade:** ALTA
- **Integridade:** MÉDIA
- **Disponibilidade:** BAIXA

#### Prova de Conceito

```javascript
// Via React DevTools:
$r.context.accessToken // Expõe token completo

// Via XSS:
const root = document.getElementById('root');
const fiber = root._reactRootContainer._internalRoot.current;
// Navegar pela árvore de fibra até encontrar o context
```

#### Solução

**Opção A - Backend Proxy (Recomendado):**

```typescript
// Backend armazena token em httpOnly cookie
// Frontend só faz requests para backend
// Backend adiciona token nas chamadas para Google

// server.ts
app.post('/api/drive/list', authenticateUser, async (req, res) => {
  const token = req.session.googleToken; // httpOnly cookie
  const response = await fetch('https://googleapis.com/drive/v3/files', {
    headers: { Authorization: `Bearer ${token}` }
  });
  res.json(await response.json());
});
```

**Opção B - Criptografia Client-Side (Temporário):**

```typescript
import CryptoJS from 'crypto-js';

const encryptToken = (token: string) => {
  const key = sessionStorage.getItem('encKey') || generateKey();
  return CryptoJS.AES.encrypt(token, key).toString();
};

const [encryptedToken, setEncryptedToken] = useState<string | null>(null);
```

#### Status

⏳ **Pendente** - Requer decisão arquitetural

---

### 3. Uso de OAuth Implicit Flow (Deprecated)

**CWE:** CWE-601 (URL Redirection to Untrusted Site)  
**CVSS Score:** 7.4 (High)

#### Descrição

O fluxo `implicit` do OAuth 2.0 foi descontinuado por motivos de segurança:

- Token retornado no URL fragment (`#access_token=...`)
- Vulnerável a token leakage via Referer header
- Sem proteção contra CSRF
- Sem refresh token capability

#### Localização

```typescript
// src/components/SimpleGoogleLogin.tsx:69
const handleGoogleLogin = useGoogleLogin({
  // ...
  flow: "implicit", // ❌ VULNERÁVEL
});
```

#### Impacto

- **Confidencialidade:** ALTA - Token vaza em URLs
- **Integridade:** MÉDIA
- **Disponibilidade:** BAIXA

#### Vetores de Ataque

1. **Referer Leakage:** URLs com tokens vazam para analytics
2. **Browser History:** Tokens ficam no histórico do navegador
3. **Open Redirects:** Atacante pode redirecionar callback

#### Solução

```typescript
// Migrar para Authorization Code Flow with PKCE
const handleGoogleLogin = useGoogleLogin({
  flow: "auth-code", // ✅ SEGURO
  onSuccess: async (codeResponse) => {
    // Trocar code por token no backend
    const response = await fetch('/api/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ code: codeResponse.code }),
    });
    const { accessToken } = await response.json();
    // Backend armazena token em httpOnly cookie
  }
});
```

**Backend necessário:**

```typescript
// server/auth.ts
app.post('/api/auth/exchange', async (req, res) => {
  const { code } = req.body;
  
  // Trocar code por token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: JSON.stringify({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  
  const { access_token, refresh_token } = await tokenResponse.json();
  
  // Armazenar em httpOnly cookie
  res.cookie('accessToken', access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 3600000,
  });
  
  // Armazenar refresh_token em banco de dados criptografado
  await db.saveRefreshToken(req.user.id, encrypt(refresh_token));
  
  res.json({ success: true });
});
```

#### Status

⏳ **Pendente** - Requer implementação de backend

---

### 4. Falta de Validação de Assinatura JWT

**CWE:** CWE-345 (Insufficient Verification of Data Authenticity)  
**CVSS Score:** 8.5 (High)

#### Descrição

O JWT retornado pelo Google é decodificado sem verificação de assinatura, permitindo que tokens forjados sejam aceitos.

#### Localização

```typescript
// src/contexts/GoogleAuthContext.tsx:34-44
const decodeJwt = (token: string): DecodedToken | null => {
  try {
    const [, payloadBase64] = token.split(".");
    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized); // ❌ Sem verificação de assinatura
    return JSON.parse(json);
  } catch (error) {
    console.error("[GoogleAuthContext] failed to decode JWT", error);
    return null;
  }
};
```

#### Impacto

- **Confidencialidade:** ALTA - Atacante pode se passar por qualquer usuário
- **Integridade:** ALTA - Dados não confiáveis
- **Disponibilidade:** BAIXA

#### Exploração

```javascript
// Atacante pode criar JWT falso:
const header = btoa(JSON.stringify({ alg: "none" }));
const payload = btoa(JSON.stringify({
  sub: "999999999",
  email: "admin@example.com",
  name: "Fake Admin",
  exp: 9999999999,
}));
const fakeJWT = `${header}.${payload}.fake-signature`;

// Aplicação aceita sem validar assinatura
setCredential(fakeJWT);
```

#### Solução

**Backend JWT Verification:**

```typescript
// server/auth.ts
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/api/auth/verify', async (req, res) => {
  const { token } = req.body;
  
  try {
    // Google verifica assinatura automaticamente
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    // Verificações adicionais
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Invalid audience');
    }
    
    if (payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    // Token válido - criar sessão
    req.session.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    
    res.json({ valid: true, user: req.session.user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});
```

**Frontend apenas envia token:**

```typescript
const verifyToken = async (token: string) => {
  const response = await fetch('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  
  if (!response.ok) {
    throw new Error('Token verification failed');
  }
  
  return response.json();
};
```

#### Status

⏳ **Pendente** - Requer backend para validação

---

## 🟠 VULNERABILIDADES ALTAS

### 5. Configuração CORS Restritiva

**CWE:** CWE-942 (Overly Permissive Cross-domain Whitelist)  
**CVSS Score:** 6.5 (Medium)

#### Descrição

OAuth configurado apenas para `localhost:5173`, impedindo deploy em produção.

#### Localização

- Google Cloud Console > OAuth 2.0 Client > Authorized JavaScript origins
- Configurado: `http://localhost:5173`

#### Impacto

- **Disponibilidade:** ALTA - App não funciona em produção
- **Confidencialidade:** BAIXA
- **Integridade:** BAIXA

#### Solução

```bash
# Google Cloud Console
# Adicionar origens autorizadas:
https://queroaulas.com
https://www.queroaulas.com
https://queroaulas.vercel.app

# Redirect URIs:
https://queroaulas.com/auth/callback
https://www.queroaulas.com/auth/callback
```

#### Status

⏳ **Pendente** - Necessário antes de deploy

---

### 6. Ausência de Rate Limiting

**CWE:** CWE-770 (Allocation of Resources Without Limits)  
**CVSS Score:** 6.0 (Medium)

#### Descrição

Chamadas ilimitadas à Drive API podem:

- Esgotar quota gratuita rapidamente
- Causar DDoS acidental
- Aumentar custos inesperadamente

#### Localização

```typescript
// src/services/driveServiceOAuth.ts
// Sem limite de chamadas por segundo/minuto
export const listFolderContents = async (
  folderId: string,
  accessToken: string
): Promise<DriveFile[]> => {
  // ❌ Pode ser chamado infinitas vezes
```

#### Impacto

- **Disponibilidade:** ALTA - Quota exhaustion
- **Confidencialidade:** BAIXA
- **Integridade:** BAIXA

#### Solução

```typescript
// src/utils/rateLimit.ts
import pLimit from 'p-limit';

const driveApiLimit = pLimit(5); // Max 5 concurrent requests

export const rateLimitedFetch = (url: string, options: RequestInit) => {
  return driveApiLimit(() => fetch(url, options));
};

// src/services/driveServiceOAuth.ts
import { rateLimitedFetch } from '../utils/rateLimit';

const response = await rateLimitedFetch(url, {
  method: "GET",
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

**Cache adicional:**

```typescript
const cache = new Map<string, { data: DriveFile[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const listFolderContents = async (
  folderId: string,
  accessToken: string
): Promise<DriveFile[]> => {
  const cached = cache.get(folderId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Fetch from API
  const data = await fetchFromDrive(folderId, accessToken);
  cache.set(folderId, { data, timestamp: Date.now() });
  
  return data;
};
```

#### Status

⏳ **Pendente** - Recomendado antes de produção

---

### 7. Possível Injection via Folder ID

**CWE:** CWE-89 (SQL Injection) / CWE-116 (Improper Encoding)  
**CVSS Score:** 6.8 (Medium)

#### Descrição

Folder ID extraído de URL é usado diretamente na query sem sanitização rigorosa.

#### Localização

```typescript
// src/services/driveServiceOAuth.ts:47-48
const query = encodeURIComponent(
  `'${folderId}' in parents and trashed = false`
);
// ❌ folderId pode conter caracteres maliciosos
```

#### Impacto

- **Integridade:** MÉDIA - Possível manipulação de query
- **Confidencialidade:** MÉDIA - Possível bypass de filtros
- **Disponibilidade:** BAIXA

#### Exploração

```javascript
// Input malicioso:
const maliciousId = "' OR '1'='1";
// Query resultante:
// '' OR '1'='1' in parents and trashed = false
```

#### Solução

```typescript
// src/services/driveServiceOAuth.ts
const FOLDER_ID_REGEX = /^[a-zA-Z0-9_-]{25,50}$/;

export const listFolderContents = async (
  folderId: string,
  accessToken: string
): Promise<DriveFile[]> => {
  // Validação rigorosa
  if (!FOLDER_ID_REGEX.test(folderId)) {
    throw new Error('Invalid folder ID format');
  }
  
  // Escapar caracteres especiais adicionalmente
  const sanitizedId = folderId.replace(/['"\\]/g, '\\$&');
  
  const query = encodeURIComponent(
    `'${sanitizedId}' in parents and trashed = false`
  );
  
  // ... resto do código
};
```

#### Status

⏳ **Pendente** - Baixa prioridade (Drive API valida IDs)

---

### 8. Falta de Token Expiration Handling

**CWE:** CWE-613 (Insufficient Session Expiration)  
**CVSS Score:** 5.9 (Medium)

#### Descrição

Tokens expirados continuam sendo usados, causando falhas silenciosas.

#### Localização

```typescript
// src/contexts/GoogleAuthContext.tsx
// ❌ Não verifica campo 'exp' do token
const setCredential = (cred: string, token?: string) => {
  const decoded = decodeJwt(cred);
  // Sem verificação de expiração
  setDecodedToken(decoded);
};
```

#### Impacto

- **Disponibilidade:** MÉDIA - Requests falhando
- **Experiência do Usuário:** ALTA - Erros sem feedback claro
- **Confidencialidade:** BAIXA

#### Solução

```typescript
// src/contexts/GoogleAuthContext.tsx
const isTokenExpired = (token: DecodedToken): boolean => {
  if (!token.exp) return true;
  return Date.now() / 1000 > token.exp - 300; // 5min buffer
};

const setCredential = (cred: string, token?: string) => {
  const decoded = decodeJwt(cred);
  
  if (!decoded || isTokenExpired(decoded)) {
    console.error('[Auth] Token expired or invalid');
    logout();
    throw new Error('Token expired. Please login again.');
  }
  
  setCredentialState(cred);
  setDecodedToken(decoded);
  
  // Auto-logout quando expirar
  if (decoded.exp) {
    const timeUntilExpiry = (decoded.exp * 1000) - Date.now();
    setTimeout(() => {
      console.log('[Auth] Token expired, logging out');
      logout();
    }, timeUntilExpiry);
  }
};

// Hook para verificar expiração
export const useTokenExpiration = () => {
  const { decodedToken, logout } = useGoogleAuth();
  
  useEffect(() => {
    if (!decodedToken) return;
    
    const checkExpiration = () => {
      if (isTokenExpired(decodedToken)) {
        logout();
      }
    };
    
    const interval = setInterval(checkExpiration, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [decodedToken, logout]);
};
```

#### Status

⏳ **Pendente** - Recomendado implementar

---

## 🟡 VULNERABILIDADES MÉDIAS

### 9. Client ID Exposto em Repositório

**CWE:** CWE-522 (Insufficiently Protected Credentials)  
**CVSS Score:** 4.3 (Medium)

#### Descrição

Client ID pode estar commitado no repositório Git.

#### Localização

```bash
# .env.local
VITE_GOOGLE_CLIENT_ID=143513834378-07d97g1u16c10oiq8t833t4q9jeoa63u.apps.googleusercontent.com
```

#### Impacto

- **Confidencialidade:** BAIXA - Client ID é público
- **Mas:** Má prática, pode revelar estrutura do projeto

#### Solução

```bash
# Verificar se .env.local está em .gitignore
echo ".env.local" >> .gitignore

# Remover do histórico se commitado
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (cuidado!)
git push origin --force --all
```

#### Status

⏳ **Pendente** - Verificar .gitignore

---

### 10. Ausência de Content Security Policy

**CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers)  
**CVSS Score:** 5.4 (Medium)

#### Descrição

Sem CSP, aplicação vulnerável a XSS via scripts de terceiros.

#### Localização

```html
<!-- index.html - Sem meta tag CSP -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <!-- ❌ Falta CSP -->
</head>
```

#### Impacto

- **Integridade:** MÉDIA - XSS possível
- **Confidencialidade:** MÉDIA - Scripts podem roubar dados
- **Disponibilidade:** BAIXA

#### Solução

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://accounts.google.com;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' 
    https://www.googleapis.com 
    https://accounts.google.com 
    https://oauth2.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' data:;
  frame-src https://accounts.google.com;
">
```

**Ou via Vite config:**

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace(
          '<head>',
          `<head>
            <meta http-equiv="Content-Security-Policy" content="...">
          `
        );
      },
    },
  ],
});
```

#### Status

⏳ **Pendente** - Recomendado para produção

---

### 11. Dados Sensíveis em URL

**CWE:** CWE-598 (Use of GET Request Method With Sensitive Query Strings)  
**CVSS Score:** 4.8 (Medium)

#### Descrição

Folder IDs podem conter informações sensíveis e são enviados via GET.

#### Localização

```typescript
// src/services/driveServiceOAuth.ts
const url = `https://www.googleapis.com/drive/v3/files?q=${query}...`;
// ❌ Folder ID na URL pode vazar em logs
```

#### Impacto

- **Confidencialidade:** MÉDIA - IDs vazam em logs de proxy/analytics
- **Integridade:** BAIXA
- **Disponibilidade:** BAIXA

#### Solução

```typescript
// Para operações sensíveis, usar POST com body
// Mas Drive API v3 só aceita GET para list
// Alternativa: Proxy backend

// server/drive.ts
app.post('/api/drive/list', authenticateUser, async (req, res) => {
  const { folderId } = req.body; // ✅ Dados no body, não na URL
  
  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'GET', // Drive API requer GET
      headers: {
        Authorization: `Bearer ${req.session.googleToken}`,
      },
      // Query params internos não vazam para cliente
      body: JSON.stringify({ q: `'${folderId}' in parents` }),
    }
  );
  
  res.json(await response.json());
});
```

#### Status

⏳ **Pendente** - Depende de backend

---

### 12. Logout Incompleto

**CWE:** CWE-613 (Insufficient Session Expiration)  
**CVSS Score:** 5.3 (Medium)

#### Descrição

Logout limpa state local mas não revoga token no Google.

#### Localização

```typescript
// src/contexts/GoogleAuthContext.tsx:69-73
const logout = () => {
  setCredentialState(null);
  setAccessTokenState(null);
  setDecodedToken(null);
  // ❌ Token continua válido no Google
};
```

#### Impacto

- **Confidencialidade:** MÉDIA - Token ainda pode ser usado se roubado
- **Integridade:** BAIXA
- **Disponibilidade:** BAIXA

#### Solução

```typescript
// src/contexts/GoogleAuthContext.tsx
const logout = async () => {
  if (accessToken) {
    try {
      // Revogar token no Google
      await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch (error) {
      console.error('[Auth] Failed to revoke token', error);
    }
  }
  
  setCredentialState(null);
  setAccessTokenState(null);
  setDecodedToken(null);
  
  // Redirecionar para login
  window.location.href = '/';
};
```

#### Status

⏳ **Pendente** - Fácil de implementar

---

## ⚪ VULNERABILIDADES BAIXAS

### 13. Mensagens de Erro Detalhadas

**CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)  
**CVSS Score:** 3.7 (Low)

#### Descrição

Mensagens de erro expõem detalhes internos da aplicação.

#### Localização

```typescript
// src/services/driveServiceOAuth.ts:66
throw new Error(error.error?.message || "Erro ao listar pasta");
// Expõe mensagens da API do Google
```

#### Impacto

- **Confidencialidade:** BAIXA - Information disclosure
- **Integridade:** BAIXA
- **Disponibilidade:** BAIXA

#### Solução

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  'invalid_grant': 'Sessão expirada. Faça login novamente.',
  'insufficient_permissions': 'Sem permissão para acessar esta pasta.',
  'not_found': 'Pasta não encontrada.',
  'rate_limit_exceeded': 'Muitas requisições. Tente novamente em alguns minutos.',
};

export const listFolderContents = async (
  folderId: string,
  accessToken: string
): Promise<DriveFile[]> => {
  try {
    // ... código
  } catch (error) {
    const apiError = error as ApiError;
    
    // Log detalhado para debugging (apenas backend)
    console.error('[Drive API Error]', {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
    });
    
    // Mensagem genérica para usuário
    const userMessage = ERROR_MESSAGES[apiError.code] || 
      'Erro ao carregar pasta. Tente novamente.';
    
    throw new Error(userMessage);
  }
};
```

#### Status

⏳ **Pendente** - Baixa prioridade

---

### 14. HTTPS Não Enforced em Desenvolvimento

**CWE:** CWE-319 (Cleartext Transmission of Sensitive Information)  
**CVSS Score:** 4.0 (Medium)

#### Descrição

Desenvolvimento em `http://localhost` transmite tokens em plaintext.

#### Localização

```json
// package.json
"scripts": {
  "dev": "vite" // ❌ Usa HTTP por padrão
}
```

#### Impacto

- **Confidencialidade:** BAIXA - Em localhost, risco é mínimo
- **Mas:** Hábito ruim para produção
- **Disponibilidade:** BAIXA

#### Solução

```bash
# Gerar certificado local
npm install -g mkcert
mkcert -install
mkcert localhost

# vite.config.ts
import fs from 'fs';

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem'),
    },
    port: 5173,
  },
});
```

**Atualizar Google Console:**

```
Authorized origins: https://localhost:5173
```

#### Status

⏳ **Pendente** - Opcional para MVP

---

## 📋 Plano de Ação

### Fase 1: Correções Críticas (Antes de Produção)

**Prioridade:** 🔴 **MÁXIMA**  
**Prazo:** Imediato

- [ ] **Tarefa 1.1:** Remover todos `console.log` com tokens
  - Arquivos: `SimpleGoogleLogin.tsx`, `driveServiceOAuth.ts`, `GoogleAuthContext.tsx`
  - Tempo estimado: 30min
  - Responsável: Dev

- [ ] **Tarefa 1.2:** Implementar verificação de token expiration
  - Arquivo: `GoogleAuthContext.tsx`
  - Tempo estimado: 2h
  - Responsável: Dev

- [ ] **Tarefa 1.3:** Implementar logout com revoke
  - Arquivo: `GoogleAuthContext.tsx`
  - Tempo estimado: 1h
  - Responsável: Dev

- [ ] **Tarefa 1.4:** Migrar para Authorization Code Flow
  - Requer: Backend
  - Tempo estimado: 8h
  - Responsável: Dev + DevOps

### Fase 2: Melhorias de Segurança (Próxima Sprint)

**Prioridade:** 🟠 **ALTA**  
**Prazo:** 1 semana

- [ ] **Tarefa 2.1:** Implementar rate limiting + cache
  - Arquivo: `driveServiceOAuth.ts`
  - Tempo estimado: 3h

- [ ] **Tarefa 2.2:** Adicionar CSP headers
  - Arquivo: `index.html` ou `vite.config.ts`
  - Tempo estimado: 1h

- [ ] **Tarefa 2.3:** Validação rigorosa de folder ID
  - Arquivo: `driveServiceOAuth.ts`
  - Tempo estimado: 1h

- [ ] **Tarefa 2.4:** Configurar domínios de produção no Google Console
  - Tempo estimado: 30min

### Fase 3: Hardening (Pós-Launch)

**Prioridade:** 🟡 **MÉDIA**  
**Prazo:** 1 mês

- [ ] **Tarefa 3.1:** Implementar backend proxy para tokens
  - Tempo estimado: 16h

- [ ] **Tarefa 3.2:** Mensagens de erro sanitizadas
  - Tempo estimado: 2h

- [ ] **Tarefa 3.3:** HTTPS em desenvolvimento
  - Tempo estimado: 1h

- [ ] **Tarefa 3.4:** Monitoramento de segurança (Sentry)
  - Tempo estimado: 4h

---

## 🔍 Recomendações Adicionais

### Testes de Segurança

```bash
# Instalar ferramentas
npm install -D eslint-plugin-security
npm install -D @microsoft/eslint-plugin-sdl

# Scan de dependências vulneráveis
npm audit
npm audit fix

# SAST (Static Analysis)
npx eslint . --ext .ts,.tsx

# Testes de penetração
# Contratar pentest ou usar OWASP ZAP
```

### Monitoramento Contínuo

```typescript
// Integrar Sentry para tracking de erros
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event, hint) {
    // Redact tokens de error logs
    if (event.exception?.values) {
      event.exception.values = event.exception.values.map(exception => ({
        ...exception,
        value: exception.value?.replace(/ya29\.[a-zA-Z0-9_-]+/g, '[REDACTED_TOKEN]')
      }));
    }
    return event;
  },
});
```

### Security Headers (Backend)

```typescript
// server.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://accounts.google.com"],
      connectSrc: ["'self'", "https://www.googleapis.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

---

## 📞 Contato

**Em caso de vulnerabilidade crítica descoberta:**

- Email: <security@queroaulas.com>
- PGP Key: [Link para chave pública]
- Bug Bounty: Em desenvolvimento

**Responsável por Segurança:**

- Nome: [A definir]
- Email: [A definir]
- Telefone: [A definir]

---

## 📚 Referências

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/)
- [Google OAuth 2.0 Best Practices](https://developers.google.com/identity/protocols/oauth2/production-readiness)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Última atualização:** 20 de janeiro de 2026  
**Próxima revisão:** 20 de fevereiro de 2026
