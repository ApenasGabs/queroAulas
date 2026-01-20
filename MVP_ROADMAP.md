# QueroAulas - Roadmap de Implementação MVP

## Visão Geral Completa

**QueroAulas** é uma aplicação web SPA (React/TypeScript) que transforma pastas do Google Drive em cursos estruturados com player de vídeo.

### Hierarquia

- **Pasta Raiz** = Título do Curso
- **Subpastas** = Módulos
- **Arquivos de vídeo** = Aulas

### Fluxo Completo

```
Login (OAuth 2.0) → Fornece Link/ID Pasta → 
Drive API Lista Recursivamente → Organiza Hierarquia →
Renderiza Sidebar + Player → Seleciona Aula →
Download Completo → HLS.js (.ts) ou HTML5 → Reprodução →
Progresso salvo LocalStorage
```

---

## Status Atual

### ✅ ETAPA 0: Player de Vídeo (CONCLUÍDA)

**Componentes Implementados**:

- ✅ `VideoPlayer.tsx` - Player com controles completos
- ✅ `VideoPlayer.css` - Estilos do player
- ✅ `useGoogleDriveUrl.ts` - Hook de conversão de URL
- ✅ Download completo com barra de progresso
- ✅ Suporte a .ts via HLS.js
- ✅ Controles: play, pause, seek, volume, fullscreen

**Funcionalidades**:

- Baixa vídeo completo do Google Drive
- Cria Blob URL local
- HLS.js faz transmuxing de MPEG-TS → fMP4 no navegador
- Exibe progresso de download (0-100%)

---

## Próximas Etapas (Em Ordem de Prioridade)

### 🎯 ETAPA 1: Autenticação e Listagem Básica

**Objetivo**: Usuário faz login e lista arquivos de uma pasta do Drive

#### Dependências Necessárias

```bash
npm install @react-oauth/google gapi-script
npm install --save-dev @types/gapi @types/gapi.auth2 @types/gapi.client.drive
```

#### Setup Google Cloud (Manual)

1. Criar projeto no [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar: Google Drive API
3. Criar credenciais OAuth 2.0 (Web Application)
4. Configurar:
   - Origem JavaScript: `http://localhost:5173`
   - URI de redirecionamento: `http://localhost:5173`
5. Copiar Client ID e API Key

#### Arquivos .env

```env
VITE_GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=sua_api_key
VITE_GOOGLE_DISCOVERY_DOCS=https://www.googleapis.com/discovery/v1/apis/drive/v3/rest
VITE_GOOGLE_SCOPES=https://www.googleapis.com/auth/drive.readonly
```

#### Componentes a Criar

**1. AuthContext.tsx** - Gerencia autenticação

```typescript
// src/contexts/AuthContext.tsx
- gapi.client.init()
- signIn() / signOut()
- isAuthenticated state
- user GoogleUser state
```

**2. LoginButton.tsx** - Botão de login/logout

```typescript
// src/components/LoginButton.tsx
- Exibe foto + nome quando logado
- Botão "Entrar com Google" quando não logado
- Usa useAuth() hook
```

**3. FolderInput.tsx** - Input para pasta

```typescript
// src/components/FolderInput.tsx
- Input aceita link ou ID
- extractFolderId() extrai ID de URLs
- onFolderLoad(folderId) callback
```

**4. driveService.ts** - API Google Drive

```typescript
// src/services/driveService.ts
- listFolderContents(folderId): Promise<DriveFile[]>
- isFolder(file): boolean
- isVideo(file): boolean
```

**5. BasicFileList.tsx** - Lista arquivos

```typescript
// src/components/BasicFileList.tsx
- Recebe folderId
- Lista arquivos com ícones (📁 pasta, 🎥 vídeo)
- Output text-only (sem UI elaborada ainda)
```

**6. Atualizar index.html**

```html
<script src="https://apis.google.com/js/api.js"></script>
```

**Checklist Etapa 1**:

- [ ] Google Cloud configurado
- [ ] .env.local criado com credenciais
- [ ] AuthContext implementado
- [ ] Login/Logout funcionando
- [ ] FolderInput aceita link ou ID
- [ ] Lista arquivos da pasta (text-only)
- [ ] Distingue pastas 📁 de vídeos 🎥

---

### 🎯 ETAPA 2: Algoritmo Recursivo e Player Integrado

**Objetivo**: Navegar hierarquia completa (módulos → aulas) e reproduzir vídeos

#### Tipos TypeScript

**course.ts**

```typescript
// src/types/course.ts
interface CourseLesson {
  id: string;
  name: string;
  driveUrl: string;
  mimeType: string;
  order: number;
}

interface CourseModule {
  id: string;
  name: string;
  lessons: CourseLesson[];
  order: number;
}

interface Course {
  id: string;          // ID pasta raiz
  title: string;       // Nome pasta raiz
  modules: CourseModule[];
}
```

#### Componentes a Criar

**1. driveService.ts (expandir)** - Busca recursiva

```typescript
// Adicionar ao src/services/driveService.ts
- buildCourseStructure(rootFolderId): Promise<Course>
  → Lista pasta raiz
  → Para cada subpasta (módulo):
    → Lista vídeos (aulas)
  → Ordena naturalmente (01, 02, 10)
  → Retorna estrutura Course completa
```

**2. useCourse.ts** - Hook de curso

```typescript
// src/hooks/useCourse.ts
- useCourse(folderId)
- Retorna: { course, loading, error }
- Chama buildCourseStructure()
```

**3. CourseSidebar.tsx** - Navegação

```typescript
// src/components/CourseSidebar.tsx
- Props: course, currentLessonId, onLessonSelect
- Accordion para módulos (▶/▼)
- Lista aulas de cada módulo
- Destaca aula ativa
```

**4. CourseView.tsx** - Layout principal

```typescript
// src/components/CourseView.tsx
- Layout: Sidebar + Main
- currentLesson state
- Integra CourseSidebar + VideoPlayer
- Placeholder quando nenhuma aula selecionada
```

**Algoritmo de Ordenação Natural**

```typescript
const naturalSort = (a: string, b: string): number => {
  return a.localeCompare(b, undefined, { 
    numeric: true, 
    sensitivity: 'base' 
  });
};
```

**Checklist Etapa 2**:

- [ ] buildCourseStructure() recursivo implementado
- [ ] Ordenação natural funcionando (01, 02, 10)
- [ ] Tipos Course/Module/Lesson definidos
- [ ] CourseSidebar exibe hierarquia
- [ ] Accordion funcional (expandir/colapsar módulos)
- [ ] VideoPlayer integrado com seleção
- [ ] Layout Sidebar + Main responsivo

---

### 🎯 ETAPA 3: Interface Polida (UI/UX)

**Objetivo**: Design profissional e responsivo

#### Design System

**globals.css**

```css
:root {
  --primary-color: #1a73e8;
  --secondary-color: #34a853;
  --background: #0f0f0f;
  --surface: #1a1a1a;
  --surface-hover: #252525;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --border: #333333;
  --accent: #ff4444;
}
```

#### Layout Responsivo

```css
.course-view {
  display: grid;
  grid-template-columns: 320px 1fr;  /* Desktop */
}

@media (max-width: 768px) {
  .course-view {
    grid-template-columns: 1fr;  /* Mobile */
  }
}
```

#### Componentes de Estilo

**1. CourseSidebar.css**

- Hover effects
- Active lesson highlight
- Accordion animation
- Scroll styling

**2. LoginButton.css**

- Google branding
- Profile photo circular
- Hover states

**3. Animações**

```css
.lesson {
  transition: background 0.2s ease;
}

.spinner {
  animation: spin 0.8s linear infinite;
}
```

**Checklist Etapa 3**:

- [ ] CSS variables para temas
- [ ] Layout grid responsivo
- [ ] Animações suaves (hover, transitions)
- [ ] Feedback visual (active, hover)
- [ ] Mobile-friendly (sidebar colapsável)
- [ ] Loading states estilizados

---

### 🎯 ETAPA 4: Persistência com LocalStorage

**Objetivo**: Salvar progresso e retomar de onde parou

#### Estrutura de Dados

**progress.ts**

```typescript
// src/types/progress.ts
interface CourseProgress {
  course_id: string;
  watched_videos: string[];      // IDs assistidos
  last_watched: string | null;   // Último assistido
  last_watched_time: number;     // Timestamp
}

interface ProgressStorage {
  [courseId: string]: CourseProgress;
}
```

**LocalStorage Schema**

```json
{
  "queroaulas_progress": {
    "folder_id_abc123": {
      "course_id": "folder_id_abc123",
      "watched_videos": ["video_id_1", "video_id_2"],
      "last_watched": "video_id_2",
      "last_watched_time": 1736937600000
    }
  }
}
```

#### Componentes a Criar

**1. progressService.ts** - CRUD LocalStorage

```typescript
// src/services/progressService.ts
- loadProgress(): ProgressStorage
- saveProgress(progress): void
- getCourseProgress(courseId): CourseProgress
- markVideoAsWatched(courseId, videoId): void
- isVideoWatched(courseId, videoId): boolean
- getLastWatchedVideo(courseId): string | null
```

**2. useProgress.ts** - Hook de progresso

```typescript
// src/hooks/useProgress.ts
- useProgress(courseId)
- Retorna: { progress, markAsWatched, isWatched, lastWatched }
- Sincroniza com LocalStorage
```

**3. Atualizar CourseSidebar.tsx**

```typescript
// Adicionar props
isLessonWatched: (lessonId: string) => boolean

// JSX
<li className={`lesson ${isWatched(lesson.id) ? 'watched' : ''}`}>
  {isWatched(lesson.id) && <span className="watched-icon">✅</span>}
  ...
</li>
```

**4. Atualizar CourseView.tsx**

```typescript
// Auto-carregar último vídeo
useEffect(() => {
  const lastVideoId = lastWatched();
  if (lastVideoId) {
    // Buscar na estrutura do curso
    // setCurrentLesson()
  } else {
    // Primeira aula do primeiro módulo
  }
}, [course]);

// Marcar como assistido ao selecionar
const handleLessonSelect = (lesson) => {
  setCurrentLesson(lesson);
  markAsWatched(lesson.id);
};
```

**Checklist Etapa 4**:

- [ ] progressService.ts implementado
- [ ] LocalStorage CRUD funcionando
- [ ] useProgress hook criado
- [ ] Checkmarks ✅ em vídeos assistidos
- [ ] CSS para .watched (opacidade reduzida)
- [ ] Auto-retomar último vídeo ao abrir curso
- [ ] Progresso persiste entre sessões
- [ ] Múltiplos cursos suportados (courseId como chave)

---

## Estrutura de Arquivos Final

```
queroAulas/
├── src/
│   ├── components/
│   │   ├── VideoPlayer.tsx           ✅ Etapa 0
│   │   ├── VideoPlayer.css           ✅ Etapa 0
│   │   ├── LoginButton.tsx           ⬜ Etapa 1
│   │   ├── FolderInput.tsx           ⬜ Etapa 1
│   │   ├── BasicFileList.tsx         ⬜ Etapa 1
│   │   ├── CourseSidebar.tsx         ⬜ Etapa 2
│   │   ├── CourseSidebar.css         ⬜ Etapa 3
│   │   └── CourseView.tsx            ⬜ Etapa 2
│   ├── contexts/
│   │   └── AuthContext.tsx           ⬜ Etapa 1
│   ├── hooks/
│   │   ├── useGoogleDriveUrl.ts      ✅ Etapa 0
│   │   ├── useCourse.ts              ⬜ Etapa 2
│   │   └── useProgress.ts            ⬜ Etapa 4
│   ├── services/
│   │   ├── driveService.ts           ⬜ Etapa 1/2
│   │   └── progressService.ts        ⬜ Etapa 4
│   ├── types/
│   │   ├── course.ts                 ⬜ Etapa 2
│   │   └── progress.ts               ⬜ Etapa 4
│   ├── styles/
│   │   └── globals.css               ⬜ Etapa 3
│   ├── App.tsx
│   └── main.tsx
├── .env.local                        ⬜ Etapa 1
├── index.html                        ⬜ Atualizar Etapa 1
├── package.json
└── vite.config.ts
```

---

## Comandos de Desenvolvimento

```bash
# Instalar dependências base (já feito)
npm install hls.js react react-dom

# Instalar dependências OAuth/Drive (Etapa 1)
npm install @react-oauth/google gapi-script
npm install --save-dev @types/gapi @types/gapi.auth2 @types/gapi.client.drive

# Rodar dev server
npm run dev

# Build de produção
npm run build
```

---

## Testes de Validação por Etapa

### Etapa 1 - Testes

1. Botão "Entrar com Google" aparece
2. Popup OAuth abre
3. Login bem-sucedido mostra foto + nome
4. Input aceita link: `https://drive.google.com/drive/folders/ABC123`
5. Input aceita ID direto: `ABC123`
6. Lista mostra pastas 📁 e vídeos 🎥
7. Logout funciona

### Etapa 2 - Testes

1. Pasta raiz vira título do curso
2. Subpastas viram módulos na sidebar
3. Arquivos .ts/.mp4 viram aulas
4. Ordenação: "01 Intro" antes de "10 Final"
5. Click no módulo expande/colapsa
6. Click na aula carrega no player
7. Player reproduz vídeo .ts corretamente

### Etapa 3 - Testes

1. Dark mode aplicado
2. Hover nos botões mostra feedback
3. Aula ativa destaca na sidebar
4. Responsivo em mobile (sidebar colapsável)
5. Animações suaves (sem jank)

### Etapa 4 - Testes

1. Assistir vídeo adiciona ✅
2. Fechar e reabrir mantém ✅
3. Abrir curso carrega último vídeo assistido
4. Múltiplos cursos têm progresso separado
5. LocalStorage não estoura limite (< 5MB)

---

## Melhorias Pós-MVP

1. **Busca Global**: Campo de busca para achar aulas
2. **Filtros**: Filtrar por módulo, assistidos/não assistidos
3. **Notas por Aula**: Textarea para anotações
4. **Exportar/Importar Progresso**: JSON backup
5. **Dashboard**: Lista todos os cursos carregados
6. **Atalhos de Teclado**: ← → para navegar aulas
7. **Picture-in-Picture**: Modo PiP
8. **Velocidade de Reprodução**: 0.5x - 2x
9. **Legendas**: Upload de .srt/.vtt
10. **Tema Claro**: Modo light alternativo

---

## Notas Técnicas para IA

### Ordem de Implementação Recomendada

1. ✅ Player (já feito)
2. ⬜ OAuth + Drive API (base fundamental)
3. ⬜ Algoritmo recursivo (core da aplicação)
4. ⬜ UI/UX (usabilidade)
5. ⬜ Persistência (QoL)

### Pontos de Atenção

- **CORS**: Google Drive permite, mas URL deve ser `/uc?export=download`
- **OAuth Scopes**: `drive.readonly` é suficiente
- **LocalStorage Limit**: 5-10MB (não salvar blobs, apenas IDs)
- **Natural Sort**: Usar `localeCompare` com `numeric: true`
- **Memory Leaks**: Sempre `revokeObjectURL()` e `hls.destroy()`
- **Mobile**: Sidebar deve ser colapsável < 768px

### Decisões Arquiteturais

- **SPA**: Sem backend, 100% client-side
- **LocalStorage**: Progresso por device (sem sync entre devices no MVP)
- **Download Completo**: Evita bloqueio de range requests do Drive
- **HLS.js**: Transmuxing no navegador (sem conversão server-side)
- **OAuth 2.0**: Padrão do Google, seguro e testado

---

## Checklist Geral MVP

### ✅ Etapa 0: Player

- [x] VideoPlayer.tsx
- [x] Download completo
- [x] HLS.js para .ts
- [x] Controles

### ⬜ Etapa 1: Auth + Listagem

- [ ] Google Cloud setup
- [ ] OAuth funcionando
- [ ] Drive API habilitada
- [ ] Input de pasta
- [ ] Lista básica

### ⬜ Etapa 2: Estrutura

- [ ] Algoritmo recursivo
- [ ] Ordenação natural
- [ ] Sidebar módulos
- [ ] Integração player

### ⬜ Etapa 3: UI/UX

- [ ] Design system
- [ ] Responsivo
- [ ] Animações
- [ ] Feedback visual

### ⬜ Etapa 4: Persistência

- [ ] LocalStorage
- [ ] Checkmarks ✅
- [ ] Auto-retomar
- [ ] Progresso por curso

**MVP completo quando todos ✅**
