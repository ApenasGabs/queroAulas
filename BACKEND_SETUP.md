# Backend Proxy Setup Guide

## 📦 Instalação

```bash
npm install
```

## 🔧 Configuração Local

1. **Crie arquivo `.env.local`:**

```bash
cp .env.example .env.local
```

1. **Configure variáveis de ambiente:**

```env
# Frontend
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_API_URL=http://localhost:3000

# Backend (para desenvolvimento local)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173
NODE_ENV=development
```

## 🚀 Desenvolvimento

### Opção 1: Rodar frontend e backend juntos

```bash
npm run dev:full
```

### Opção 2: Rodar separadamente

Terminal 1 - Frontend:

```bash
npm run dev
```

Terminal 2 - Backend:

```bash
npm run api
```

## 📤 Deploy na Vercel

### 1. Configure variáveis de ambiente na Vercel

Acesse: `https://vercel.com/[seu-usuario]/queroaulas/settings/environment-variables`

Adicione:

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://queroaulas.vercel.app
NODE_ENV=production
```

### 2. Configure Google Cloud Console

1. Acesse: <https://console.cloud.google.com>
2. Vá para **APIs & Services > Credentials**
3. Edite sua credencial OAuth 2.0
4. Adicione às **Authorized JavaScript origins**:
   - `https://queroaulas.vercel.app`
   - `https://queroaulas.com` (se tiver domínio custom)
5. Adicione às **Authorized redirect URIs**:
   - `https://queroaulas.vercel.app`
   - `https://queroaulas.com`

### 3. Deploy

```bash
# Commit e push
git add .
git commit -m "feat: add backend proxy"
git push origin main

# Vercel vai fazer deploy automático
```

Ou use Vercel CLI:

```bash
npm install -g vercel
vercel --prod
```

## 🏗️ Estrutura do Backend

```
api/
├── server.js           # Express server principal
└── routes/
    ├── auth.js         # Autenticação OAuth
    └── drive.js        # Proxy para Drive API
```

## 🔐 Segurança Implementada

✅ **Tokens não expostos no frontend**

- Access tokens armazenados apenas no backend
- Frontend só envia código de autorização

✅ **Validação de JWT**

- Verificação de assinatura via google-auth-library
- Validação de audience e expiração

✅ **Sanitização de inputs**

- Validação rigorosa de folder IDs
- Regex para prevenir injection

✅ **Mensagens de erro seguras**

- Erros genéricos para usuário
- Detalhes apenas em logs do servidor

✅ **CORS configurado**

- Apenas origens autorizadas
- Credenciais habilitadas

## 📡 Endpoints da API

### Autenticação

**POST** `/api/auth/exchange`

- Troca código OAuth por tokens
- Body: `{ code: string }`
- Response: `{ user, tokens }`

**POST** `/api/auth/verify`

- Verifica ID token
- Body: `{ token: string }`
- Response: `{ valid: boolean, user }`

**POST** `/api/auth/revoke`

- Revoga access token
- Body: `{ token: string }`
- Response: `{ success: boolean }`

**POST** `/api/auth/refresh`

- Atualiza access token
- Body: `{ refreshToken: string }`
- Response: `{ tokens }`

### Google Drive

**POST** `/api/drive/list`

- Lista conteúdo de pasta
- Headers: `Authorization: Bearer <token>`
- Body: `{ folderId: string }`
- Response: `{ files: DriveFile[] }`

**GET** `/api/drive/file/:fileId`

- Obtém metadados de arquivo
- Headers: `Authorization: Bearer <token>`
- Response: `DriveFile`

### Health Check

**GET** `/api/ping`

- Verifica status da API
- Response: `{ status: "ok", timestamp: string }`

## 🐛 Troubleshooting

### Erro: "CORS policy"

Verifique se `VITE_API_URL` está configurado corretamente no `.env.local`

### Erro: "Invalid credentials"

1. Verifique se variáveis de ambiente estão na Vercel
2. Confirme que `GOOGLE_CLIENT_SECRET` está correto
3. Certifique-se que redirect URIs estão configurados no Google Console

### Erro: "Token expired"

Implemente refresh token automático no frontend (próxima etapa)

### API não responde em produção

1. Verifique logs na Vercel: `vercel logs`
2. Confirme que `vercel.json` está correto
3. Teste endpoint: `https://queroaulas.vercel.app/api/ping`

## 📚 Próximos Passos

1. ✅ Backend proxy configurado
2. ⏳ Atualizar frontend para usar API
3. ⏳ Implementar refresh token automático
4. ⏳ Adicionar cache no backend
5. ⏳ Implementar rate limiting

## 🔗 Links Úteis

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Express.js](https://expressjs.com/)
