# 🎬 QueroAulas - Web Player para Google Drive

Um web player profissional construído com **React + TypeScript + Vite** que permite reproduzir vídeos direto do Google Drive, com suporte a múltiplos formatos incluindo .ts (MPEG-TS).

## ✨ Destaques

- ▶️ **Player completo**: Play, pause, volume, tela cheia
- 🎯 **Google Drive integrado**: Reproduz URLs do Google Drive diretamente
- 📱 **Responsivo**: Funciona em desktop, tablet e mobile
- ⚡ **Rápido**: Sem dependências pesadas, puro React + TypeScript
- 🎨 **Moderno**: UI elegante e intuitiva
- 📊 **Controles avançados**: Timeline, volume, tela cheia, display de tempo

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Acessar em
http://localhost:5173
```

## 💻 Uso Básico

```tsx
import { VideoPlayer } from './components/VideoPlayer'

export default function App() {
  return (
    <VideoPlayer 
      googleDriveUrl="https://drive.google.com/file/d/FILE_ID/view"
      title="Meu Vídeo"
    />
  )
}
```

## 📚 Documentação

- 📖 [Guia Completo](./PLAYER_README.md) - Documentação detalhada
- ⚡ [Quick Start](./QUICK_START.md) - Comece em 2 minutos
- 🔧 [Docs Técnicas](./TECHNICAL_DOCS.md) - Arquitetura e implementação
- 🎯 [Exemplos](./src/examples.tsx) - Casos de uso

## 🎮 Recursos do Player

✅ Controle de reprodução (play/pause)  
✅ Barra de progresso interativa  
✅ Controle de volume  
✅ Modo tela cheia (⛶)  
✅ Display de tempo (00:00 / 10:20)  
✅ Suporte para múltiplos formatos (MP4, WebM, .ts, etc)  
✅ Conversão automática de URLs do Google Drive  
✅ Design responsivo  
✅ Tratamento de erros  

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── VideoPlayer.tsx          # Componente principal do player
│   ├── VideoPlayer.css          # Estilos do player
│   ├── VideoPlayerDemo.tsx      # Interface de demo
│   └── VideoPlayerDemo.css      # Estilos da demo
├── hooks/
│   └── useGoogleDriveUrl.ts    # Hook para converter URLs
├── App.tsx                      # Componente raiz
└── App.css                      # Estilos globais
```

## 🔗 Como Obter URL do Google Drive

1. Abra seu vídeo no Google Drive
2. Clique em "Compartilhar"
3. Configure para "Qualquer pessoa com o link pode visualizar"
4. Copie a URL
5. Cole no player

Formatos suportados:

- `https://drive.google.com/file/d/FILE_ID/view`
- `https://drive.google.com/open?id=FILE_ID`
- `FILE_ID` (apenas o identificador)

## 🛠️ Build para Produção

```bash
npm run build       # Gera pasta 'dist/'
npm run preview     # Visualizar build localmente
```

## 📦 Dependências

- **React**: ^19.2.0
- **TypeScript**: ~5.9.3
- **Vite**: 7.2.5

## 🌐 Compatibilidade

| Navegador | Versão |
|-----------|--------|
| Chrome    | 90+    |
| Firefox   | 88+    |
| Safari    | 14+    |
| Edge      | 90+    |

## 🔒 Segurança

- ✅ Sem scripts de terceiros inseguros
- ✅ CORS gerenciado automaticamente pelo Google Drive
- ✅ Validação de URLs
- ✅ Video element nativo (seguro por padrão)

## 🤝 Próximas Features

- [ ] Playlist de vídeos
- [ ] Legendas/Subtítulos
- [ ] Qualidade de streaming
- [ ] Histórico de visualização
- [ ] Analytics
- [ ] Modo escuro/claro

## 📝 Scripts Disponíveis

```bash
npm run dev        # Inicia servidor de desenvolvimento
npm run build      # Build otimizado para produção
npm run lint       # Executa ESLint
npm run preview    # Preview do build
```

## 🎓 Exemplos de Uso

### Exemplo Básico

```tsx
<VideoPlayer googleDriveUrl="https://drive.google.com/file/d/...id/view" />
```

### Com Título Customizado

```tsx
<VideoPlayer 
  googleDriveUrl="https://drive.google.com/file/d/...id/view"
  title="Meu Vídeo Especial"
/>
```

### Com Auto Play

```tsx
<VideoPlayer 
  googleDriveUrl="https://drive.google.com/file/d/...id/view"
  title="Tutorial"
  autoPlay={true}
/>
```

## 🚨 Troubleshooting

**Vídeo não carrega?**

- Verifique se a URL é válida
- Confirme que o arquivo está compartilhado publicamente
- Verifique o console do navegador para erros

**Erro de CORS?**

- Use a URL correta do Google Drive
- Certifique-se de que o compartilhamento está habilitado

## 📞 Suporte

Confira a [documentação completa](./PLAYER_README.md) ou [documentação técnica](./TECHNICAL_DOCS.md) para mais informações.

---

**Stack**: React 19 + TypeScript + Vite  
**Status**: ✅ Pronto para Produção  
**Data**: 14 de Janeiro de 2026
