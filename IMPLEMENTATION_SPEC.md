# Especificação de Implementação - QueroAulas

## Visão Geral do Sistema

**QueroAulas** é uma aplicação web Single Page Application (SPA) desenvolvida em React/TypeScript que atua como uma camada de visualização ("skin") sobre o Google Drive, transformando estruturas de pastas em cursos organizados com player de vídeo integrado.

### Conceito Principal

- **Pasta Raiz** no Google Drive = **Título do Curso**
- **Subpastas** = **Módulos do Curso**
- **Arquivos de vídeo** = **Aulas**

### Funcionalidades Core

1. **Autenticação**: Login via Google OAuth 2.0
2. **Integração Google Drive API v3**: Leitura recursiva de estrutura de pastas
3. **Player de Vídeo**: Reprodução de vídeos .ts e formatos nativos com download completo
4. **Navegação**: Sidebar com módulos/aulas organizados hierarquicamente
5. **Persistência**: LocalStorage para progresso e último vídeo assistido
6. **Ordenação Natural**: Arquivos ordenados naturalmente (01, 02, 10 em ordem correta)

## Stack Tecnológico

### Dependências Obrigatórias

```json
{
  "dependencies": {
    "hls.js": "^1.6.15",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@react-oauth/google": "^0.12.1",
    "gapi-script": "^1.2.0"
  },
  "devDependencies": {
    "@types/gapi": "^0.0.47",
    "@types/gapi.auth2": "^0.0.57",
    "@types/gapi.client.drive": "^3.0.0",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "typescript": "~5.9.3",
    "vite": "^7.2.5"
  }
}
```

### APIs Externas

- **Google Drive API v3**: Listagem e acesso a arquivos/pastas
- **Google OAuth 2.0**: Autenticação de usuários
- **Google Cloud Console**: Credenciais OAuth (Client ID, API Key)

### Requisitos de Ambiente

- Node.js 20.19.0 ou superior
- TypeScript 5.9.3
- React 19.2.0
- Vite 7.2.5
- Conta Google Cloud com Drive API habilitada

## Arquitetura do Sistema

### Fluxo de Dados

```
URL Google Drive → useGoogleDriveUrl Hook → Download via Fetch API → 
Blob URL → HLS.js (se .ts) ou HTML5 Video (nativos) → Reprodução
```

### Componentes a Implementar

#### 1. Hook: `useGoogleDriveUrl.ts`

**Localização**: `src/hooks/useGoogleDriveUrl.ts`

**Propósito**: Converter URLs do Google Drive para formato de download direto

**Implementação**:

```typescript
import { useMemo } from "react";

export const extractFileId = (url: string): string | null => {
  // Formato 1: https://drive.google.com/file/d/FILE_ID/view
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];

  // Formato 2: https://drive.google.com/open?id=FILE_ID
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];

  // Formato 3: https://drive.google.com/uc?id=FILE_ID
  const match3 = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (match3) return match3[1];

  return null;
};

export const useGoogleDriveUrl = (driveUrl: string): string => {
  return useMemo(() => {
    const fileId = extractFileId(driveUrl);
    if (!fileId) return driveUrl;
    
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }, [driveUrl]);
};
```

**Testes Necessários**:

- URL formato `/file/d/ID/view` → deve extrair ID
- URL formato `?id=ID` → deve extrair ID
- URL formato `/uc?id=ID` → deve extrair ID
- URL inválida → retorna URL original

---

#### 2. Componente: `VideoPlayer.tsx`

**Localização**: `src/components/VideoPlayer.tsx`

**Props Interface**:

```typescript
interface VideoPlayerProps {
  googleDriveUrl: string;  // URL do Google Drive (qualquer formato)
  title?: string;           // Título do vídeo (opcional)
  autoPlay?: boolean;       // Auto-reproduzir (opcional, padrão: false)
}
```

**Estados Necessários**:

```typescript
const [isPlaying, setIsPlaying] = useState(autoPlay);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [volume, setVolume] = useState(1);
const [isFullscreen, setIsFullscreen] = useState(false);
const [error, setError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [downloadProgress, setDownloadProgress] = useState(0);
const [blobUrl, setBlobUrl] = useState<string | null>(null);
```

**Refs Necessárias**:

```typescript
const videoRef = useRef<HTMLVideoElement>(null);
const containerRef = useRef<HTMLDivElement>(null);
const hlsRef = useRef<Hls | null>(null);
```

**Lógica de Download (useEffect #1)**:

```typescript
useEffect(() => {
  if (!videoUrl) return;

  const downloadVideo = async () => {
    setIsLoading(true);
    setError(null);
    setDownloadProgress(0);

    try {
      const response = await fetch(videoUrl, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Falha no download: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Não foi possível iniciar download');
      }

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        received += value.length;
        
        if (total > 0) {
          setDownloadProgress(Math.round((received / total) * 100));
        }
      }

      const blob = new Blob(chunks as BlobPart[], { type: 'video/mp2t' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setIsLoading(false);

    } catch (err) {
      console.error('Erro ao baixar vídeo:', err);
      setError(`Erro ao baixar: ${err instanceof Error ? err.message : 'Desconhecido'}`);
      setIsLoading(false);
    }
  };

  downloadVideo();

  return () => {
    // Cleanup em desmontagem
  };
}, [videoUrl]);
```

**Lógica de Reprodução (useEffect #2)**:

```typescript
useEffect(() => {
  const video = videoRef.current;
  if (!video || !blobUrl) return;

  const isTransportStream = googleDriveUrl.toLowerCase().includes('.ts');

  // Se for .ts e o navegador suportar HLS.js
  if (isTransportStream && Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
    });

    hlsRef.current = hls;
    hls.loadSource(blobUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        setError(`Erro ao reproduzir: ${data.type}`);
      }
    });

    return () => {
      hls.destroy();
    };
  }
  // Reprodução nativa (MP4, WebM, etc)
  else {
    video.src = blobUrl;
  }

  // Event listeners para controle do player
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleTimeUpdate = () => setCurrentTime(video.currentTime);
  const handleLoadedMetadata = () => {
    setDuration(video.duration);
  };
  const handleCanPlay = () => setIsLoading(false);
  const handleError = () => {
    if (!hlsRef.current) {
      setError('Falha ao carregar vídeo');
    }
  };

  video.addEventListener('play', handlePlay);
  video.addEventListener('pause', handlePause);
  video.addEventListener('timeupdate', handleTimeUpdate);
  video.addEventListener('loadedmetadata', handleLoadedMetadata);
  video.addEventListener('canplay', handleCanPlay);
  video.addEventListener('error', handleError);

  return () => {
    video.removeEventListener('play', handlePlay);
    video.removeEventListener('pause', handlePause);
    video.removeEventListener('timeupdate', handleTimeUpdate);
    video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    video.removeEventListener('canplay', handleCanPlay);
    video.removeEventListener('error', handleError);

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  };
}, [blobUrl, googleDriveUrl]);
```

**Funções de Controle**:

```typescript
const togglePlay = () => {
  if (videoRef.current) {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }
};

const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newTime = parseFloat(e.target.value);
  if (videoRef.current) {
    videoRef.current.currentTime = newTime;
  }
};

const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newVolume = parseFloat(e.target.value);
  setVolume(newVolume);
  if (videoRef.current) {
    videoRef.current.volume = newVolume;
  }
};

const toggleFullscreen = async () => {
  if (!containerRef.current) return;

  try {
    if (!isFullscreen) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  } catch (error) {
    console.error("Erro ao alternar fullscreen:", error);
  }
};

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};
```

**JSX Structure**:

```tsx
return (
  <div ref={containerRef} className="video-player-container">
    <div className="video-player-header">
      <h3>{title}</h3>
    </div>

    <div className="video-player-wrapper">
      <video
        ref={videoRef}
        className="video-player"
        crossOrigin="anonymous"
      />

      {error && (
        <div className="video-error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="video-controls">
        <div className="progress-bar-container">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            className="progress-bar"
          />
        </div>

        <div className="controls-bottom">
          <div className="controls-left">
            <button onClick={togglePlay}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            
            <div className="volume-control">
              <button>
                {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>

            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          <div className="controls-right">
            <button onClick={toggleFullscreen}>
              {isFullscreen ? "⛶" : "⛶"}
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Baixando vídeo do Google Drive...</p>
          {downloadProgress > 0 && (
            <div className="download-progress">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${downloadProgress}%` }}
              />
              <span>{downloadProgress}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
```

---

#### 3. Estilos: `VideoPlayer.css`

**Localização**: `src/components/VideoPlayer.css`

**Classes CSS Necessárias**:

```css
.video-player-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.video-player-wrapper {
  position: relative;
  width: 100%;
  background: #000;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 20px 16px 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-player-wrapper:hover .video-controls {
  opacity: 1;
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 5;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ff0000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.download-progress {
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  margin-top: 8px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff0000, #ff4444);
  transition: width 0.3s ease;
}

.download-progress span {
  position: absolute;
  top: -25px;
  right: 0;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
```

---

## Decisões Técnicas Importantes

### Por que Download Completo?

**Problema**: Google Drive bloqueia requisições HTTP Range, impedindo streaming tradicional

**Solução**:

1. Baixar arquivo completo via Fetch API
2. Criar Blob URL local
3. Reproduzir do Blob (não há requisições de range ao Google Drive)

### Por que HLS.js?

**Problema**: Navegadores não suportam nativamente MPEG-TS (.ts)

**Solução**: HLS.js faz transmuxing (MPEG-TS → fMP4) no navegador via JavaScript

**Alternativas Descartadas**:

- ❌ Proxy server: Adiciona complexidade de backend
- ❌ FFmpeg no servidor: Requer conversão prévia
- ✅ HLS.js: Funciona 100% no frontend

### Tratamento de Memória

**Importante**:

- Sempre chamar `URL.revokeObjectURL()` no cleanup
- Blobs grandes podem consumir muita memória
- Limpar HLS instance com `hls.destroy()`

---

## Casos de Uso

### Caso 1: Vídeo .ts do Google Drive

```typescript
<VideoPlayer 
  googleDriveUrl="https://drive.google.com/file/d/ABC123/view"
  title="Aula 01"
  autoPlay={false}
/>
```

**Fluxo**:

1. Hook extrai ID → `https://drive.google.com/uc?export=download&id=ABC123&confirm=t`
2. Download completo com progresso
3. Blob criado
4. HLS.js detecta .ts e faz transmuxing
5. Reprodução

### Caso 2: Vídeo MP4 do Google Drive

```typescript
<VideoPlayer 
  googleDriveUrl="https://drive.google.com/open?id=XYZ789"
/>
```

**Fluxo**:

1. Hook extrai ID
2. Download completo
3. Blob criado
4. Reprodução nativa (HTML5 video)

---

## Testes de Validação

### Checklist de Implementação

- [ ] Hook extrai FILE_ID corretamente de 3 formatos de URL
- [ ] Download mostra progresso de 0-100%
- [ ] Arquivo .ts é processado por HLS.js
- [ ] Arquivo MP4/WebM usa reprodução nativa
- [ ] Controles funcionam: play, pause, seek, volume
- [ ] Tela cheia funciona
- [ ] Limpeza de memória (revokeObjectURL) acontece
- [ ] Mensagens de erro são exibidas
- [ ] Loading indicator aparece durante download

### Comandos de Teste

```bash
npm install
npm run dev
# Testar com URL real do Google Drive
```

---

## Problemas Conhecidos e Soluções

### Problema: CORS Error

**Solução**: Google Drive permite CORS, mas URL deve estar no formato correto (`/uc?export=download`)

### Problema: Vídeo não carrega

**Verificar**:

1. URL do Google Drive é pública?
2. Formato do arquivo é suportado?
3. Console mostra erros de download?

### Problema: .ts não reproduz

**Verificar**:

1. HLS.js instalado? `npm list hls.js`
2. Import correto? `import Hls from 'hls.js'`
3. `Hls.isSupported()` retorna true?

---

## Melhorias Futuras

1. **Cache**: Salvar Blob no IndexedDB para evitar re-downloads
2. **Múltiplas qualidades**: Detectar se vídeo tem versões em diferentes resoluções
3. **Legendas**: Suporte a arquivos .srt/.vtt
4. **Picture-in-Picture**: Usar Picture-in-Picture API
5. **Playlist**: Suporte a múltiplos vídeos em sequência
6. **Velocidade de reprodução**: Controle de 0.5x até 2x

---

## Estrutura Final de Arquivos

```
src/
├── components/
│   ├── VideoPlayer.tsx          # Componente principal
│   └── VideoPlayer.css          # Estilos
├── hooks/
│   └── useGoogleDriveUrl.ts     # Hook de conversão de URL
└── App.tsx                      # Uso do componente

package.json                     # Dependências
tsconfig.json                    # Config TypeScript
vite.config.ts                   # Config Vite
```

---

## Comandos de Setup Completo

```bash
# 1. Criar projeto Vite + React + TypeScript
npm create vite@latest projeto-player -- --template react-ts
cd projeto-player

# 2. Instalar dependências
npm install
npm install hls.js

# 3. Criar estrutura de pastas
mkdir -p src/hooks src/components

# 4. Criar arquivos conforme especificação acima

# 5. Rodar
npm run dev
```

---

## Notas de Implementação para IA

1. **Ordem de implementação**: Hook → CSS → VideoPlayer → Teste
2. **TypeScript strict**: Garantir que todos os tipos estão corretos
3. **Event listeners**: Sempre remover no cleanup do useEffect
4. **Memory leaks**: Revocar Blob URLs e destruir HLS instance
5. **Error handling**: Try-catch em todas operações assíncronas
6. **Progress tracking**: ReadableStream permite tracking granular
7. **Cross-browser**: HLS.js funciona em todos browsers modernos exceto Safari (que tem suporte nativo)
