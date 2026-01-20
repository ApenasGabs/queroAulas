# 📋 Plano de Ação - QueroAulas

**Data**: 14 de janeiro de 2026  
**Status Atual**: ✅ Etapa 0 concluída (Player de Vídeo)  
**Próximo Marco**: Etapa 1 - Autenticação e Listagem

---

## 🎯 Opções de Implementação

### Opção A: Sequencial Completa (Recomendada para MVP)

**Tempo estimado**: 3-4 semanas  
**Complexidade**: Baixa  
**Risco**: Baixo

Implementar cada etapa completamente antes de avançar.

**Vantagens**:

- ✅ Cada etapa é testável isoladamente
- ✅ Menor chance de retrabalho
- ✅ Progresso linear e previsível
- ✅ Fácil debugging por etapa

**Desvantagens**:

- ❌ Funcionalidade completa demora mais
- ❌ Sem demonstração funcional até etapa 2

**Cronograma**:

```
Semana 1: Etapa 1 (Auth + Listagem)
Semana 2: Etapa 2 (Estrutura Recursiva + Player)
Semana 3: Etapa 3 (UI/UX Polimento)
Semana 4: Etapa 4 (Persistência + Testes)
```

---

### Opção B: Vertical Slice (Funcionalidade Completa Primeiro)

**Tempo estimado**: 2-3 semanas  
**Complexidade**: Média  
**Risco**: Médio

Implementar um fluxo completo end-to-end minimalista primeiro.

**Vantagens**:

- ✅ Demo funcional em 1 semana
- ✅ Validação de conceito rápida
- ✅ Feedback de usuários cedo
- ✅ Motivação por ver funcionando

**Desvantagens**:

- ❌ UI básica na primeira versão
- ❌ Refatoração necessária depois
- ❌ Código pode ficar "feio" temporariamente

**Fases**:

```
Fase 1 (3-4 dias): 
  - Auth básico (sem UI)
  - Listagem simples (console.log)
  - Player integrado (já pronto)
  - Teste: assistir 1 vídeo

Fase 2 (3-4 dias):
  - Estrutura recursiva básica
  - Sidebar mínima (sem CSS)
  - Navegação entre aulas

Fase 3 (5-7 dias):
  - Polimento UI/UX
  - Persistência LocalStorage
  - Testes finais
```

---

### Opção C: Híbrida (Funcionalidade Core + Iteração)

**Tempo estimado**: 3 semanas  
**Complexidade**: Média  
**Risco**: Médio-Baixo

Implementar funcionalidades core com UI básica, depois iterar.

**Vantagens**:

- ✅ Balanceado entre velocidade e qualidade
- ✅ Funcional em 10 dias
- ✅ UI fica melhor progressivamente
- ✅ Menor risco que Opção B

**Desvantagens**:

- ❌ Requer boa arquitetura inicial
- ❌ Planejamento mais complexo

**Sprints**:

```
Sprint 1 (Semana 1):
  - Auth completo (Etapa 1)
  - UI básica do Auth
  - Testes de integração Google

Sprint 2 (Semana 2):
  - Algoritmo recursivo (Etapa 2)
  - Sidebar funcional com CSS básico
  - Player integrado
  - Demo funcional disponível

Sprint 3 (Semana 3):
  - Polimento UI (Etapa 3)
  - LocalStorage (Etapa 4)
  - Testes e refinamentos
```

---

## 🚀 Recomendação: Opção A (Sequencial)

### Justificativa

Para o MVP e considerando que é um projeto pessoal/solo:

1. **Qualidade**: Cada etapa bem testada
2. **Documentação**: Roadmap já segue essa lógica
3. **Manutenibilidade**: Código limpo desde o início
4. **Aprendizado**: Menos pressão, mais tempo para entender

---

## 📅 Plano Detalhado - Opção A

### SEMANA 1: Etapa 1 - Autenticação e Listagem

#### Dia 1-2: Setup Google Cloud + OAuth

**Tarefas**:

- [ ] Criar projeto no Google Cloud Console
- [ ] Habilitar Google Drive API
- [ ] Configurar OAuth 2.0 credentials
- [ ] Criar `.env.local` com credenciais
- [ ] Instalar dependências:

  ```bash
  npm install @react-oauth/google gapi-script
  npm install --save-dev @types/gapi @types/gapi.auth2 @types/gapi.client.drive
  ```

**Arquivos**:

- `.env.local`
- Atualizar `index.html` com script gapi

**Teste**: Popup OAuth abre e retorna token

---

#### Dia 3-4: Contexto de Autenticação

**Tarefas**:

- [ ] Criar `src/contexts/AuthContext.tsx`
  - `gapi.client.init()`
  - `signIn()` / `signOut()`
  - `isAuthenticated` state
  - `user` GoogleUser state
- [ ] Criar `src/components/LoginButton.tsx`
  - Botão "Entrar com Google"
  - Foto + nome quando logado
  - Dropdown com logout
- [ ] Atualizar `App.tsx` para usar AuthProvider

**Arquivos**:

- `src/contexts/AuthContext.tsx`
- `src/components/LoginButton.tsx`
- `src/components/LoginButton.css`

**Teste**: Login/Logout completo funciona

---

#### Dia 5: Drive Service + Input

**Tarefas**:

- [ ] Criar `src/services/driveService.ts`
  - `listFolderContents(folderId)`
  - `isFolder(file)`
  - `isVideo(file)`
- [ ] Criar `src/components/FolderInput.tsx`
  - Input aceita link ou ID
  - `extractFolderId()` helper
  - Validação básica

**Arquivos**:

- `src/services/driveService.ts`
- `src/components/FolderInput.tsx`

**Teste**: Extração de ID funciona para ambos formatos

---

#### Dia 6-7: Listagem Básica + Testes

**Tarefas**:

- [ ] Criar `src/components/BasicFileList.tsx`
  - Lista arquivos com ícones
  - Distingue pastas 📁 de vídeos 🎥
- [ ] Integrar tudo no `App.tsx`
- [ ] Testes manuais completos
- [ ] Ajustes e bugfixes

**Arquivos**:

- `src/components/BasicFileList.tsx`
- Atualizar `App.tsx`

**Teste**: Todos os testes da Etapa 1 passam

---

### SEMANA 2: Etapa 2 - Estrutura Recursiva

#### Dia 8-9: Tipos e Algoritmo Recursivo

**Tarefas**:

- [ ] Criar `src/types/course.ts`
  - Interface `CourseLesson`
  - Interface `CourseModule`
  - Interface `Course`
- [ ] Expandir `driveService.ts`
  - `buildCourseStructure(rootFolderId)`
  - Busca recursiva de subpastas
  - Ordenação natural (naturalSort)

**Arquivos**:

- `src/types/course.ts`
- Atualizar `src/services/driveService.ts`

**Teste**: Console.log da estrutura Course está correta

---

#### Dia 10-11: Hook e Sidebar

**Tarefas**:

- [ ] Criar `src/hooks/useCourse.ts`
  - Hook `useCourse(folderId)`
  - States: course, loading, error
- [ ] Criar `src/components/CourseSidebar.tsx`
  - Accordion para módulos
  - Lista de aulas
  - Props: course, currentLessonId, onLessonSelect

**Arquivos**:

- `src/hooks/useCourse.ts`
- `src/components/CourseSidebar.tsx`

**Teste**: Sidebar renderiza hierarquia completa

---

#### Dia 12-14: Integração + CourseView

**Tarefas**:

- [ ] Criar `src/components/CourseView.tsx`
  - Layout grid: Sidebar + Main
  - State: currentLesson
  - Integrar CourseSidebar + VideoPlayer
  - Placeholder quando nenhuma aula
- [ ] Atualizar `App.tsx`
  - Fluxo: Login → Input → CourseView
- [ ] Testes completos Etapa 2
- [ ] Bugfixes

**Arquivos**:

- `src/components/CourseView.tsx`
- Atualizar `App.tsx`

**Teste**: Clique na aula carrega vídeo no player

---

### SEMANA 3: Etapa 3 - UI/UX Profissional

#### Dia 15-16: Design System

**Tarefas**:

- [ ] Criar `src/styles/globals.css`
  - CSS variables (cores, espaçamentos)
  - Reset básico
  - Tipografia
- [ ] Aplicar design system em componentes existentes
  - LoginButton
  - FolderInput
  - BasicFileList

**Arquivos**:

- `src/styles/globals.css`
- Atualizar CSS de componentes

**Teste**: Consistência visual em todos os componentes

---

#### Dia 17-18: Sidebar + Animações

**Tarefas**:

- [ ] Criar `src/components/CourseSidebar.css`
  - Accordion animation
  - Hover effects
  - Active lesson highlight
  - Scroll styling
- [ ] Adicionar animações suaves
  - Transições de hover
  - Loading spinners
  - Expandir/colapsar módulos

**Arquivos**:

- `src/components/CourseSidebar.css`

**Teste**: Animações fluidas, sem jank

---

#### Dia 19-21: Responsividade + Polimento

**Tarefas**:

- [ ] Layout responsivo
  - Grid adaptativo (desktop/tablet/mobile)
  - Sidebar colapsável em mobile
  - Breakpoints
- [ ] Estados visuais
  - Loading states
  - Error states
  - Empty states
- [ ] Ajustes finais de UX
- [ ] Testes em diferentes resoluções

**Arquivos**:

- Atualizar CSS de todos os componentes
- Media queries

**Teste**: Funcional em mobile, tablet e desktop

---

### SEMANA 4: Etapa 4 - Persistência

#### Dia 22-23: LocalStorage Service

**Tarefas**:

- [ ] Criar `src/types/progress.ts`
  - Interface `CourseProgress`
  - Interface `ProgressStorage`
- [ ] Criar `src/services/progressService.ts`
  - `loadProgress()`
  - `saveProgress()`
  - `getCourseProgress()`
  - `markVideoAsWatched()`
  - `isVideoWatched()`
  - `getLastWatchedVideo()`

**Arquivos**:

- `src/types/progress.ts`
- `src/services/progressService.ts`

**Teste**: CRUD LocalStorage funciona

---

#### Dia 24-25: Hook de Progresso + Integração

**Tarefas**:

- [ ] Criar `src/hooks/useProgress.ts`
  - Hook `useProgress(courseId)`
  - Sincronização automática
- [ ] Atualizar `CourseSidebar.tsx`
  - Props: isLessonWatched
  - Checkmark ✅ visual
  - CSS para .watched
- [ ] Atualizar `CourseView.tsx`
  - Auto-carregar último vídeo
  - Marcar como assistido ao selecionar

**Arquivos**:

- `src/hooks/useProgress.ts`
- Atualizar `CourseSidebar.tsx`
- Atualizar `CourseView.tsx`

**Teste**: Progresso persiste entre sessões

---

#### Dia 26-28: Testes Finais + MVP Release

**Tarefas**:

- [ ] Validação completa (todos os testes do roadmap)
- [ ] Testes de integração end-to-end
- [ ] Performance check
- [ ] Build de produção
- [ ] Deploy (Vercel/Netlify/GitHub Pages)
- [ ] Documentação README.md

**Deliverables**:

- [ ] MVP 100% funcional
- [ ] README.md atualizado
- [ ] .env.example para outros devs
- [ ] Build otimizado

**Teste**: Todos os checklists ✅

---

## 🔄 Alternativa: Opção C (Híbrida) - Sprint Detalhado

### Sprint 1 (7 dias): Auth + Fundação

**Dia 1-2**: Google Cloud + OAuth

- Setup completo
- Login funcional

**Dia 3-4**: Drive Service

- `driveService.ts` completo
- Listagem básica

**Dia 5-7**: UI Básica Auth

- LoginButton com CSS mínimo
- FolderInput com validação
- BasicFileList estilizado

**Entrega**: Login + listagem funcional

---

### Sprint 2 (7 dias): Core Funcional

**Dia 8-9**: Algoritmo + Tipos

- `course.ts`
- `buildCourseStructure()`
- Ordenação natural

**Dia 10-12**: Sidebar + Player

- CourseSidebar funcional
- Integração VideoPlayer
- CSS básico (sem polimento)

**Dia 13-14**: CourseView + Testes

- Layout grid básico
- Fluxo completo end-to-end
- Bugfixes críticos

**Entrega**: Demo funcional de curso completo

---

### Sprint 3 (7 dias): Polimento + Persistência

**Dia 15-17**: UI/UX

- Design system
- Animações
- Responsividade

**Dia 18-20**: LocalStorage

- progressService
- useProgress
- Checkmarks ✅

**Dia 21**: MVP Release

- Testes finais
- Deploy

**Entrega**: MVP polido e completo

---

## 📊 Comparação de Opções

| Critério | Opção A | Opção B | Opção C |
|----------|---------|---------|---------|
| **Tempo até MVP** | 4 semanas | 2-3 semanas | 3 semanas |
| **Qualidade do código** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Demo funcional** | Semana 2 | Semana 1 | Semana 2 |
| **Risco de retrabalho** | Baixo | Alto | Médio |
| **Facilidade de debug** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Motivação** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 Decisão Recomendada

### Para Projeto Pessoal: **Opção A (Sequencial)**

### Para Portfolio/Demo Rápido: **Opção C (Híbrida)**

### Para Validação de Conceito: **Opção B (Vertical Slice)**

---

## 📝 Próximos Passos Imediatos

### Se escolher Opção A

```bash
# 1. Setup Google Cloud (manual no console)
# 2. Instalar dependências
npm install @react-oauth/google gapi-script
npm install --save-dev @types/gapi @types/gapi.auth2 @types/gapi.client.drive

# 3. Criar .env.local
touch .env.local

# 4. Começar AuthContext
mkdir -p src/contexts
# Criar AuthContext.tsx
```

### Se escolher Opção C

```bash
# 1. Mesmo setup OAuth
# 2. Criar estrutura de pastas completa
mkdir -p src/{contexts,hooks,services,types,styles,components}

# 3. Implementar vertical slice mínimo primeiro
# AuthContext → driveService → CourseView básico
```

---

## ✅ Checklist de Decisão

Antes de começar, confirme:

- [ ] Google Cloud Console tem projeto criado?
- [ ] Credenciais OAuth 2.0 estão prontas?
- [ ] `.env.local` está configurado?
- [ ] Dependências instaladas?
- [ ] Escolheu qual opção seguir? (A/B/C)
- [ ] Criou branch de desenvolvimento?

```bash
git checkout -b feature/etapa-1-auth
```

---

## 🎓 Dicas para Implementação

### Ordem de Codificação (Opção A)

1. **Tipos primeiro**: Sempre criar interfaces antes de componentes
2. **Services antes de UI**: Lógica de negócio isolada
3. **Hooks entre Services e UI**: Abstração da lógica
4. **Componentes por último**: Apresentação pura

### Padrões de Commit

```
feat(auth): implementar AuthContext e login OAuth
feat(drive): adicionar listagem de pastas
feat(ui): criar CourseSidebar com accordion
fix(player): corrigir memory leak no HLS.js
style(sidebar): adicionar hover effects
refactor(course): extrair naturalSort para utils
docs: atualizar README com instruções de setup
```

### Testing Checklist por Etapa

**Etapa 1**:

- [ ] Login abre popup
- [ ] Foto + nome aparecem
- [ ] Logout funciona
- [ ] Input aceita link e ID
- [ ] Lista mostra 📁 e 🎥

**Etapa 2**:

- [ ] Estrutura recursiva correta
- [ ] Ordenação natural (01, 02, 10)
- [ ] Accordion funciona
- [ ] Seleção de aula carrega player

**Etapa 3**:

- [ ] Dark mode consistente
- [ ] Hover mostra feedback
- [ ] Responsivo em mobile
- [ ] Animações suaves

**Etapa 4**:

- [ ] Checkmarks persistem
- [ ] Auto-retomar último vídeo
- [ ] Múltiplos cursos separados

---

## 📚 Recursos de Referência

### Documentação Oficial

- [Google Drive API](https://developers.google.com/drive/api/v3/about-sdk)
- [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [HLS.js](https://github.com/video-dev/hls.js/)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)

### Exemplos de Código

- OAuth React: `@react-oauth/google` docs
- Drive Listing: Google API Explorer
- LocalStorage: MDN Web Docs

---

## 🚨 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Bloqueio OAuth | Média | Alto | Documentar bem, testar cedo |
| CORS no Drive | Baixa | Alto | Usar URLs corretas (`/uc?export=download`) |
| Memory leak HLS.js | Média | Médio | `destroy()` em cleanup |
| LocalStorage full | Baixa | Médio | Apenas IDs, não blobs |
| Ordenação errada | Média | Baixo | `localeCompare` com testes |

---

## 🎉 Critérios de Sucesso do MVP

1. ✅ Usuário faz login com Google
2. ✅ Fornece link de pasta do Drive
3. ✅ Ve estrutura: curso → módulos → aulas
4. ✅ Clica em aula e assiste vídeo .ts
5. ✅ Progresso persiste entre sessões
6. ✅ Interface responsiva e profissional
7. ✅ Funciona em Chrome/Firefox/Safari

**Quando todos ✅ → MVP completo!**

---

**Última atualização**: 14 de janeiro de 2026  
**Versão**: 1.0  
**Próxima revisão**: Após conclusão da Etapa 1
