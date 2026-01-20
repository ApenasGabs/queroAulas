# QueroAulas - Instruções de Setup 🎓

## 📋 Pré-requisitos

1. Node.js instalado (v18 ou superior)
2. Conta Google
3. Projeto no Google Cloud Console

---

## 🔧 Setup do Google Cloud

### Passo 1: Criar Projeto

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Clique em "Novo Projeto" ou selecione um existente
3. Nomeie o projeto (ex: "QueroAulas")

### Passo 2: Habilitar API

1. No menu lateral, vá em **APIs & Services** > **Library**
2. Busque por "Google Drive API"
3. Clique em **Enable** (Habilitar)

### Passo 3: Configurar OAuth 2.0

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **OAuth client ID**
3. Se solicitado, configure a tela de consentimento:
   - User Type: **External**
   - App name: **QueroAulas**
   - User support email: seu email
   - Developer contact: seu email
   - Scopes: não adicione nenhum agora
   - Test users: adicione seu email
4. Configure o OAuth client ID:
   - Application type: **Web application**
   - Name: **QueroAulas Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:5173`
   - Authorized redirect URIs:
     - `http://localhost:5173`
5. Clique em **Create**
6. Copie o **Client ID** (termina com `.apps.googleusercontent.com`)

### Passo 4: Obter API Key

1. Na mesma página de Credentials
2. Clique em **Create Credentials** > **API key**
3. Copie a API key gerada
4. (Opcional) Clique em "Restrict Key" para limitar ao Drive API

---

## ⚙️ Configuração Local

### 1. Clonar o Repositório

```bash
git clone <seu-repositorio>
cd queroAulas
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` na raiz do projeto:

```env
VITE_GOOGLE_CLIENT_ID=seu_client_id_aqui.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=sua_api_key_aqui
VITE_GOOGLE_DISCOVERY_DOCS=https://www.googleapis.com/discovery/v1/apis/drive/v3/rest
VITE_GOOGLE_SCOPES=https://www.googleapis.com/auth/drive.readonly
```

**⚠️ IMPORTANTE:** Substitua os valores de exemplo pelas suas credenciais reais!

### 4. Rodar o Projeto

```bash
npm run dev
```

O projeto estará disponível em: `http://localhost:5173`

---

## ✅ Testando a Aplicação

### Checklist de Testes - Etapa 1

1. **Login**
   - [ ] Botão "Entrar com Google" aparece
   - [ ] Popup OAuth abre
   - [ ] Login bem-sucedido mostra foto + nome
   - [ ] Informações do usuário estão corretas

2. **Input de Pasta**
   - [ ] Aceita link completo: `https://drive.google.com/drive/folders/ABC123`
   - [ ] Aceita apenas ID: `ABC123`
   - [ ] Mostra erro para input vazio
   - [ ] Botão fica desabilitado enquanto carrega

3. **Listagem de Arquivos**
   - [ ] Pastas aparecem com ícone 📁
   - [ ] Vídeos aparecem com ícone 🎥
   - [ ] Arquivos são separados por tipo
   - [ ] Contador mostra quantidade correta
   - [ ] Loading aparece durante carregamento
   - [ ] Mensagem de erro aparece se falhar

4. **Logout**
   - [ ] Botão "Sair" funciona
   - [ ] Retorna para tela de boas-vindas
   - [ ] Estado é limpo corretamente

---

## 🐛 Troubleshooting

### Erro: "Access blocked: This app's request is invalid"

**Solução:** Verifique se:

- As URLs autorizadas no Google Cloud estão corretas
- Você está acessando exatamente `http://localhost:5173` (sem porta diferente)
- O Client ID no `.env.local` está correto

### Erro: "API key not valid"

**Solução:**

- Verifique se a API key está correta
- Certifique-se de que a Drive API está habilitada
- Aguarde alguns minutos (pode levar tempo para propagar)

### Erro: "Failed to load folder contents"

**Solução:**

- Verifique se você tem acesso à pasta no Drive
- Confirme que a pasta existe e não foi deletada
- Tente com uma pasta diferente para testar

### Popup OAuth não abre

**Solução:**

- Verifique se o navegador não está bloqueando popups
- Abra o console (F12) e veja se há erros
- Limpe cache e cookies do navegador

---

## 📁 Estrutura de Arquivos Criada

```
queroAulas/
├── .env.local                    # Suas credenciais (NÃO COMMITAR!)
├── .env.example                  # Template para outros devs
├── index.html                    # Script gapi adicionado
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx       # ✅ Gerenciamento de autenticação
│   ├── components/
│   │   ├── LoginButton.tsx       # ✅ Botão de login/logout
│   │   ├── LoginButton.css       # ✅ Estilos do botão
│   │   ├── FolderInput.tsx       # ✅ Input para pasta do Drive
│   │   ├── FolderInput.css       # ✅ Estilos do input
│   │   ├── BasicFileList.tsx     # ✅ Listagem de arquivos
│   │   └── BasicFileList.css     # ✅ Estilos da listagem
│   ├── services/
│   │   └── driveService.ts       # ✅ Funções da Drive API
│   ├── App.tsx                   # ✅ Componente principal
│   ├── App.css                   # ✅ Estilos da aplicação
│   └── index.css                 # ✅ Reset CSS global
└── package.json                  # Dependências instaladas
```

---

## 🎯 Status de Implementação

### ✅ Etapa 1: Autenticação e Listagem (CONCLUÍDA!)

- [x] Setup Google Cloud
- [x] Instalação de dependências
- [x] AuthContext com OAuth
- [x] LoginButton com UI
- [x] driveService com API calls
- [x] FolderInput com validação
- [x] BasicFileList com separação por tipo
- [x] Integração no App.tsx
- [x] Estilos básicos aplicados

### 📍 Próximos Passos

**Etapa 2: Estrutura Recursiva**

- Algoritmo para listar pastas recursivamente
- Tipos Course/Module/Lesson
- Componente CourseSidebar
- Integração com VideoPlayer existente

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview

# Limpar cache
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique o console do navegador (F12)
2. Consulte a documentação do [Google Drive API](https://developers.google.com/drive/api/v3/about-sdk)
3. Revise este arquivo de setup

---

**Desenvolvido por:** ApenasGabs  
**Última atualização:** 14 de janeiro de 2026
