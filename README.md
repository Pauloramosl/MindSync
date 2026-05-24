# MindSync — Ideias e Tarefas Inteligentes

MindSync é uma aplicação offline-first e multiplataforma desenvolvida para capturar ideias instantaneamente (texto, arquivos, links ou simulação de voz), organizá-las automaticamente usando Inteligência Artificial local e convertê-las de forma assistida em tarefas acionáveis com checklists interativos e lembretes integrados.

---

## Visão Geral

### Objetivo
Ajudar pessoas com fluxo intenso de pensamentos a descarregarem suas mentes em segundos através de múltiplos formatos de entrada, garantindo que as ideias sejam tratadas, refinadas por IA e convertidas em ações práticas sem atritos.

### Problema Resolvido
Evita a perda de insights valiosos que surgem ao longo do dia, reduz a sobrecarga cognitiva e combate a procrastinação ao quebrar ideias abstratas em sub-tarefas simples e acionáveis estruturadas de forma imediata.

### Fluxo Principal
```text
Ideia (Surge)
   ↓
Captura (Multiplataforma)
   ↓
Inbox (Triagem inicial / Dashboard)
   ↓
IA (Classificação, Resumo, Priorização)
   ↓
Tarefa (Aprovação e Checklist)
   ↓
Lembretes (Scanners de inatividade)
   ↓
Execução (Quadro Kanban Temporal)
```

---

## Funcionalidades Implementadas

### Ideias
*   **Status:** Concluído (Etapa 2 - Visual & UX Ricos)
*   **Funcionalidades:**
    *   **Captura de Texto:** Campo de entrada com auto-ajuste de altura focado em digitação fluida.
    *   **Captura de Voz (Simulado):** Botão com waveform animada que transcreve inputs por áudio simulados em tempo real.
    *   **Mobile Voice Bottom Sheet:** Painel tátil deslizante no mobile com waveforms interativas e digitação automática por voz.
    *   **Entrada de Mídia/Links:** Atalhos rápidos para inclusão de links web e caminhos de arquivos simulados.
    *   **Inbox Widget:** Triagem no painel central exibindo os 3 itens mais recentes pendentes de processamento.
    *   **Quadro de Visualizações:** Segmented control sofisticado permitindo visualizar suas ideias em 5 layouts:
        *   *Cards (default):* Grid de glasscards.
        *   *Lista:* Visão tabular Notion-style com prioridades e tags.
        *   *Linha do Tempo:* Feed cronológico interativo simulando conexões entre pensamentos.
        *   *Kanban:* Triagem em raias conforme status (`new`, `review`, etc.).
        *   *Mapa Mental:* Canvas radial conectando ideias de forma orbital às suas categorias.
    *   **Tags:** Mapeamento de categorias e etiquetas dinâmicas com cores HSL harmônicas.

### Tarefas
*   **Status:** Concluído (Etapa 2 - Agrupamento Temporal)
*   **Funcionalidades:**
    *   **Abas Temporais de Execução:** Separação automática do fluxo de tarefas em 4 seções lógicas:
        *   *Hoje:* Atividades sem prazo ou agendadas para expirar hoje.
        *   *Próximas:* Planejadas com prazos no futuro.
        *   *Atrasadas:* Itens pendentes cujos prazos são inferiores ao dia de hoje.
        *   *Concluídas:* Listagem de registros concluídos (`done`).
    *   **Conversão Assistida por IA:** Modal interativo que quebra ideias em tarefas menores sugerindo checklist e prioridade.
    *   **Checklist Interativo:** Sub-itens marcáveis diretamente nos cartões de tarefas com barras de progresso elásticas (`X/Y completados`).
    *   **Prioridades de Escopo:** Categorizações visuais em Coral Red (Urgente), Laranja (Alta), Celeste (Média) e Esmeralda (Baixa).

### IA
*   **Status:** Em desenvolvimento (Simulado Localmente na Etapa 2)
*   **Recursos:**
    *   **Classificação Inteligente:** Filtra palavras no texto e atribui categorias como `Trabalho`, `Estudos`, `Pessoal` ou `Negócios` instantaneamente.
    *   **Resumos Rápidos:** Cria subtítulos de 1 a 2 sentenças para contextualizar capturas extensas.
    *   **Decomposição em checklists:** Transforma uma frase abstrata em um plano de ação ordenado e de 5 passos sugeridos.
    *   **Priorização Heurística:** Identifica palavras de urgência para atribuir pesos prioritários nos cartões.

---

## Estrutura do Projeto

O código-fonte está estruturado de forma limpa e modularizada sob a seguinte arquitetura de pastas:

```text
src/
├── database/            # Inicialização e Schemas do IndexedDB (Dexie.js)
│   └── db.js
├── styles/              # Design System em Vanilla CSS
│   ├── variables.css    # Variáveis globais, HEX dos temas, sombras e border-radii
│   └── global.css       # Imports de Fontes, Scrollbars premium e resets
├── services/            # Serviços de Lógica e Processamento
│   ├── aiService.js     # Motor Heurístico de IA (Gemini Mock)
│   └── reminderService.js # Scanner de inatividade e Notificações locais
├── store/               # Gerenciamento de Estado (React Context Providers)
│   ├── ThemeContext.jsx # Provedor de temas (Dark/Light), escutas e persistência
│   ├── IdeasContext.jsx # Provedor de ideias, filtros e configurações
│   └── TasksContext.jsx # Provedor de tarefas e conexões transacionais
├── components/          # Componentes Reutilizáveis
│   ├── layout/          # Sidebar, MobileNav, Header e Spotlight Search Panel
│   ├── common/          # GlassCard, botões e modais genéricos
│   ├── ideas/           # CaptureDock, IdeaCards e AIPreviewModal
│   └── tasks/           # TaskCards com checklists integrados
└── views/               # Telas do Aplicativo (Inbox Dashboard, Brainstorm, Kanban, Review, Settings)
```

---

## Banco de Dados

Utilizamos o **IndexedDB** como armazenamento de alto desempenho no navegador do usuário, envelopado com o **Dexie.js** para consultas assíncronas rápidas e offline-first.

Na **Etapa 4**, o banco de dados foi atualizado para a **Versão 2** com uma modelagem de dados estendida, suportando relacionamentos ricos, fila transacional de sincronização e logs detalhados:

### Estrutura de Tabelas (Versão 2)

#### 1. Tabela `users`
*   `id` (Chave Primária): UUID string (padrão: `user-default-123` para simulações locais)
*   `name`: Nome completo do usuário
*   `email`: Endereço de email do usuário
*   `avatarUrl`: Caminho da imagem de avatar do perfil
*   `createdAt` & `updatedAt`: Timestamps locais
*   `preferences`: Objeto contendo configurações de alertas, tema, idioma, capturas e notificações push

#### 2. Tabela `ideas`
Armazena as capturas e insights processados pela IA local:
*   `id` (Chave Primária): UUID string
*   `userId` (Chave Estrangeira): ID do usuário associado
*   `title`: Título resumido da ideia
*   `description`: Conteúdo textual original
*   `type`: Formato (`text` | `voice` | `image` | `link` | `file`)
*   `status`: Estado (`new` | `review` | `transformed` | `completed` | `archived`)
*   `priority`: Urgência (`low` | `medium` | `high` | `urgent`)
*   `tags` (Multi-indexada `*tags`): Array de categorias (`Trabalho`, `Estudos`, etc.)
*   `isArchived`: Flag boolean de arquivamento
*   `isFavorite`: Flag boolean de item favoritado
*   `createdAt` & `updatedAt`: Timestamps Unix locais de modificação
*   `aiSummary`: Resumo da IA local

#### 3. Tabela `tasks`
Armazena os fluxos de ações gerados pela conversão:
*   `id` (Chave Primária): UUID string
*   `userId` (Chave Estrangeira): ID do usuário associado
*   `ideaId` (Chave Estrangeira): Link relacional com a Ideia de origem
*   `title` & `description`: Título e notas detalhadas da tarefa
*   `status`: Raia Kanban (`todo` | `doing` | `waiting` | `review` | `done`)
*   `priority`: Urgência (`low` | `medium` | `high` | `urgent`)
*   `deadline`: Timestamp Unix do prazo final da tarefa
*   `reminderAt`: Timestamp Unix para envio de alertas push
*   `isArchived` & `isFavorite`: Flags booleanas de status
*   `createdAt` & `updatedAt`: Timestamps locais de alteração

#### 4. Tabela `checklists`
Sub-itens individuais reativos associados a tarefas:
*   `id` (Chave Primária): UUID string
*   `taskId` (Chave Estrangeira): Link com a tarefa proprietária
*   `title`: Nome da sub-tarefa acionável
*   `isCompleted`: Flag boolean de conclusão
*   `order`: Índice inteiro de ordenação visual do checklist
*   `createdAt`: Timestamp local de criação

#### 5. Tabela `tags`
Categorias e etiquetas customizadas:
*   `id` (Chave Primária): UUID string
*   `userId`: ID do usuário
*   `name`: Nome exclusivo da etiqueta
*   `color`: Código de cor HSL correspondente
*   `createdAt`: Timestamp local de criação

#### 6. Tabela `notifications`
Registro e auditoria de disparos de lembretes:
*   `id` (Chave Primária): UUID string
*   `userId`: ID do usuário
*   `targetType` & `targetId`: Tipo de entidade alvo (`idea` | `task` | `review`) e ID correspondente
*   `type`: Categoria do alerta (`forgotten_idea` | `deadline_reminder` | `daily_review` | `weekly_review`)
*   `status`: Estado do envio (`scheduled` | `sent` | `failed` | `cancelled`)
*   `scheduledAt`, `sentAt` & `createdAt`: Carimbos cronológicos de controle

#### 7. Tabelas de Revisões (`daily_reviews` e `weekly_reviews`)
Armazenam históricos de triagens realizadas pelo usuário:
*   `id` (Chave Primária): UUID string
*   `userId`: ID do usuário
*   `date` / `weekStart` & `weekEnd`: Intervalo temporal de referência
*   `createdAt`: Timestamp local do log

#### 8. Tabela `idea_relations`
Associações semânticas entre ideias afins no Mapa Mental:
*   `id` (Chave Primária): UUID string
*   `sourceIdeaId` & `relatedIdeaId`: IDs das ideias de origem e de destino
*   `relationType`: Tipo de relacionamento (`duplicate` | `related` | `parent` | `child`)

#### 9. Tabela `sync_queue`
Fila transacional offline para replicação assíncrona:
*   `id` (Chave Primária): UUID string
*   `action`: Operação executada (`create` | `update` | `delete`)
*   `entityType`: Tabela modificada (`ideas` | `tasks` | `checklists` | etc.)
*   `entityId`: ID físico do registro modificado
*   `status`: Estado na fila (`pending` | `synced` | `failed` | `conflict`)
*   `createdAt`: Timestamp de registro da instrução

#### 10. Tabela `settings`
Preferências globais persistidas e identificadores de máquina:
*   `id` (Chave Primária): String estática `"default"`
*   `deviceId`: String identificadora única do dispositivo de hardware
*   `forgottenIdeasTime`: Horas de tolerância de ociosidade do Inbox (default: `4`)
*   `dailyReviewTime`: Horário `"HH:MM"` do disparo diário (default: `"20:00"`)
*   `weeklyReviewEnabled`: Estado do lembrete de fechamento semanal (default: `true`)
*   `weeklyReviewDay` & `weeklyReviewTime`: Dia e horário de disparo
*   `aiAutoCategorization`: Flag de ativação do classificador de IA local (default: `true`)
*   `pushNotificationsEnabled`: Controle de envio para o barramento do SO (default: `true`)
*   `voiceCaptureEnabled` & `language`: Estado do microfone e idioma preferido do app
*   `theme`: Preferência ativa de tema (`dark` | `light`)

---

## Navegação

A navegação foi projetada de forma responsiva utilizando estados fluidos de roteamento acoplados no `App.jsx`:

*   **Navegação Desktop (Sidebar fixa):** Menu de acesso rápido translúcido com indicadores visuais elásticos laterais.
*   **Navegação Mobile (Bottom Bar persistente):** Menu ergonômico posicionado na base com um botão central flutuante destacado `+` que foca e abre o Bottom Sheet de voz/áudio interativo.
*   **Spotlight Search (Ctrl + K):** Barra de pesquisa no Header que abre um painel central Raycast-style para varredura e saltos rápidos de navegação no banco local.
*   **Páginas Implementadas:**
    1.  `Inbox (Home)`: Dashboard consolidado contendo captura, ideias pendentes, tarefas abertas e balanço de lembretes.
    2.  `Quadro de Ideias (Brainstorm)`: Filtros avançados e segmented controls para 5 modos de visualização (Lista, Cards, Timeline, Kanban e Mapa Mental).
    3.  `Minhas Tarefas`: Listagem de tarefas em 4 raias temporais (Hoje, Próximas, Atrasadas, Concluídas).
    4.  `Revisões Diárias`: Dashboard estatístico consolidando atividades com simulador de notificações do SO.
    5.  `Ajustes`: Comutador de escuta do sistema e preferências do processamento local.

---

## Design System

O MindSync adota um estilo visual refinado inspirado em Notion, Linear e Raycast:

### Temas e Identidade Cromática
*   **Tema Dark (Principal/Default):**
    *   Background Principal: `#050816`
    *   Background Secundário: `#0D1226`
    *   Cards & Painéis: `#18213C`
    *   Superfícies de Fundo: `#121A30`
    *   Cor de Destaque (Accent): `#3B82F6` (Hover: `#2563EB`)
    *   Texto Principal: `#FFFFFF`
    *   Texto Secundário: `#D6D9E3`
    *   Texto Auxiliar: `#9EA6BD`
    *   Sombras (Shadow): `0px 8px 32px rgba(0,0,0,0.45)`
    *   Glow IA: `0px 0px 24px rgba(59,130,246,0.35)`
*   **Tema Light (Comutável / Sincronizado com o SO):**
    *   Background Principal: `#FFFFFF`
    *   Background Secundário: `#F5F7FB`
    *   Cards & Painéis: `#FFFFFF`
    *   Cor de Destaque (Accent): `#2563EB` (Hover: `#1D4ED8`)
    *   Texto Principal: `#111827`
    *   Texto Secundário: `#374151`
    *   Texto Auxiliar: `#6B7280`
    *   Sombras (Shadow): `0px 12px 30px rgba(15,23,42,0.08)`
    *   Glow IA: `0px 0px 24px rgba(37,99,235,0.20)`

### Tokens de Cantos Arredondados (Bordas Obrigatórias)
*   **Cards & Painéis:** `24px` (`var(--radius-card)`)
*   **Botões de Ação:** `18px` (`var(--radius-btn)`)
*   **Campos de Entrada (Inputs):** `16px` (`var(--radius-input)`)
*   **Mini Componentes (Chips/Pills):** `12px` (`var(--radius-mini)`)

---

## Motion & Microinterações

*   **Transição de Cartões (Hover Lift):** Ao passar o mouse, os cartões levantam-se levemente (`translateY(-2px)`) e suas sombras suavizam, criando a sensação de resposta física.
*   **Pulsação Neon (Pulse Glow):** Botão do gravador de voz e tags prioritárias piscam suavemente no background simulando processamentos de IA ativos.
*   **Ondas Sonoras (Waveform):** Barras elásticas verticais animadas com delays variáveis que dançam na tela quando o usuário captura áudio.
*   **Modais Elásticos (Zoom-in Spring):** Modais e o Spotlight Search surgem com zoom e transições cúbicas que dão sensação elástica ao usuário (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
*   **Mobile Slide-up:** Painel tátil de áudio móvel sobe e desce de forma suave baseada em curvas bezier aceleradas (`cubic-bezier(0.16, 1, 0.3, 1)`).

---

## Roadmap

### MVP
*   `[x]` Captura rápida (texto, links e arquivos)
*   `[x]` Inbox de triagem inteligente (Dashboard Notion-like)
*   `[x]` Conversão de ideias para tarefas
*   `[x]` Checklist e priorização de tarefas
*   `[x]` Lembretes locais de inatividade (Ideias Esquecidas)
*   `[x]` Quadro Kanban responsivo
*   `[x]` Alternador de Temas (Dark/Light, Manual e OS Auto-detect)

### Fase IA
*   `[x]` Classificação de tags por heurística semântica
*   `[x]` Resumo inteligente integrado nas capturas
*   `[x]` Múltiplos Modos de Ideias (Cards, Tabela, Timeline, Kanban e Mapa Mental)
*   `[x]` Divisão Temporal de Tarefas (Hoje, Próximas, Atrasadas, Concluídas)
*   `[ ]` Agrupamento por contexto
*   `[ ]` Conexão inteligente entre ideias afins

### Futuro
*   `[ ]` Widgets móveis para iOS / Android
*   `[ ]` Modo Caminhada (gravação contínua por voz hands-free)
*   `[ ]` Assistente virtual proativo de planejamento

---

## Histórico de Implementações

### Etapa 1
*   **Data:** 23 de Maio de 2026
*   **Itens criados:** Inicialização do ecossistema multiplataforma (PWA), Banco de Dados IndexedDB local, Motores locais de IA e Notificações nativas do SO, Provedores globais de Estado (Ideas e Tasks) e Conjunto de 5 Telas integradas com Vanilla CSS Design System premium.
*   **Arquivos adicionados:**
    *   `src/database/db.js`
    *   `src/styles/variables.css`
    *   `src/styles/global.css`
    *   `src/services/aiService.js`
    *   `src/services/reminderService.js`
    *   `src/store/IdeasContext.jsx`
    *   `src/store/TasksContext.jsx`
    *   `src/components/layout/layout.css`
    *   `src/components/layout/Sidebar.jsx`
    *   `src/components/layout/MobileNav.jsx`
    *   `src/components/layout/Header.jsx`
    *   `src/components/common/common.css`
    *   `src/components/common/GlassCard.jsx`
    *   `src/components/ideas/ideas.css`
    *   `src/components/ideas/IdeaCaptureInput.jsx`
    *   `src/components/ideas/IdeaCard.jsx`
    *   `src/components/ideas/AIPreviewModal.jsx`
    *   `src/components/tasks/tasks.css`
    *   `src/components/tasks/TaskCard.jsx`
    *   `src/views/views.css`
    *   `src/views/Inbox.jsx`
    *   `src/views/Brainstorm.jsx`
    *   `src/views/TaskManager.jsx`
    *   `src/views/DailyReview.jsx`
    *   `src/views/Settings.jsx`
*   **Mudanças:** Sobrescrita de arquivos padrão scaffolded do Vite para acoplar o design system e layouts sem interferências. Correção de bug de recuo lateral nas visualizações em desktop para evitar sobreposição sob o menu lateral fixed.
*   **Decisões técnicas:**
    *   **Offline-First:** Persistir tudo no IndexedDB garante performance instantânea e funcionamento sem rede.
    *   **Heurística Semântica Local:** O mock de IA processa palavras-chave localmente sem depender de chamadas síncronas de rede pesadas, simulando perfeitamente a latência de APIs corporativas.
    *   **Vanilla CSS HSL:** Variáveis de cores HSL facilitam ajustes e transições dinâmicas de cores em temas escuros sem depender de runtimes de CSS-in-JS ou frameworks pesados.
*   **Pendências:** Integração direta com SDK de IA real (Gemini API) e sincronização multi-dispositivo baseada em nuvem na Etapa 2.

### Etapa 2
*   **Data:** 23 de Maio de 2026
*   **Itens criados:** Comutação e escuta de Temas (Dark/Light), Redesenho da Home Notion-style, 5 Visualizações de Ideias (Lista, Cards, Timeline, Kanban, Mapa Radial), 4 Abas Temporais de Tarefas (Hoje, Próximas, Atrasadas, Concluídas), Spotlight Search Panel (Raycast-style), e Voice Bottom Sheet deslizante.
*   **Arquivos adicionados/modificados:**
    *   `src/store/ThemeContext.jsx` (NOVO)
    *   `src/styles/variables.css` (ATUALIZADO - HEX, radii, sombras, cores secundárias e grid de fundo)
    *   `src/components/common/common.css` (ATUALIZADO - radius e shadow tokens)
    *   `src/components/layout/layout.css` (ATUALIZADO - spotlight, bottom sheet, mobile bottom nav dinâmico)
    *   `src/components/layout/Header.jsx` (ATUALIZADO - Sun/Moon toggle, Raycast Spotlight)
    *   `src/App.jsx` (ATUALIZADO - ThemeProvider, voice bottom sheet)
    *   `src/views/views.css` (ATUALIZADO - layouts, segmented controls, alinhamento do slider switch)
    *   `src/views/Inbox.jsx` (ATUALIZADO - Home Dashboard widgets Notion-like)
    *   `src/views/Brainstorm.jsx` (ATUALIZADO - Segmented 5 view layouts, radial mindmap, coordenadas consistentes)
    *   `src/views/TaskManager.jsx` (ATUALIZADO - Abas temporais Hoje, Próximas, Atrasadas, Concluídas)
*   **Decisões Visuais & Polimento de UI/UX:**
    *   **Aderência às Referências (Linear/Raycast):** O comutador Spotlight e os segmented controls de layout fornecem uma sensação nativa e minimalista de comandos.
    *   **Raios de Canto Obrigatórios:** Seguir rigidamente os tamanhos (24px para cards, 18px para botões, 16px para inputs e 12px para mini pílulas) unificou a consistência geométrica da interface.
    *   **Sincronização com o SO:** Escutar e sincronizar com a preferência de tema do SO do usuário previne atritos de carregamento iniciais.
    *   **Aprimoramento de Contraste e Switches:** Refinamento dos fundos do Header com o token `var(--glass-bg)` para eliminar blocos acinzentados no modo claro e correção matemática de centralização vertical (`top: 4px; left: 4px`) e brilho ativo dinâmico `var(--primary-glow)` para os sliders de IA em ambos os temas.
    *   **Ativação de Cores de Gradação (`--secondary`):** Declaração formal da cor secundária nos dois escopos de tema (`#8B5CF6` escuro e `#6366F1` claro), dando vida aos gradientes violeta/indigo e consertando renderizações quebras em andamento.
    *   **Ancoragem do Mapa Mental:** Centralização física das bolinhas orbitais com `transform: translate(-50%, -50%)`, alinhando os nós circulares exatamente aos conectores radiais do SVG. A grelha de pontos de fundo foi mapeada com `var(--grid-dot)` dinâmico, tornando-se visível nos dois modos.
    *   **Eliminação de Fundos Escuros Fixos no Modo Claro:** Atualização de colunas Kanban, blocos insets de checklists, empty-states e relatórios de opacidade fixa para usar `var(--bg-surface)` e `var(--bg-secondary)`, obtendo 100% de conformidade com a paleta do Light Mode e contrastes WCAG AA.
*   **Pendências:** Integração ativa com animações e microinterações na Etapa 3.

### Etapa 3 — Motion Design + Microinterações + Estados
*   **Data:** 23 de Maio de 2026
*   **Itens criados:** Conversão do ecossistema para **Motion First** de alta fidelidade: sistema completo de animação fluida, microinterações táteis e tratamentos robustos de estados de carregamento e conectividade.
*   **Arquivos adicionados/modificados:**
    *   `src/styles/global.css` (ATUALIZADO - staggers de múltiplos de 80ms, shimmer skeleton, voice breathing glow, feixe de energia IA)
    *   `src/components/common/common.css` (ATUALIZADO - hovers/presses táteis, elevação com glow)
    *   `src/components/ideas/ideas.css` (ATUALIZADO - overlays de ação, barras de áudio ativas/flat, zooms elásticos)
    *   `src/components/ideas/IdeaCaptureInput.jsx` (ATUALIZADO - simulador de áudio com as fases Escutando, Processando, Transcrevendo e Salvando integrado com Toasters)
    *   `src/components/ideas/IdeaCard.jsx` (ATUALIZADO - interceptadores de animação isSaving/isExiting de 400ms, drag & drop HTML5 nativo)
    *   `src/components/ideas/AIPreviewModal.jsx` (ATUALIZADO - estados inteligentes da IA, dots wave de pensamento, staggers de renderização)
    *   `src/views/views.css` (ATUALIZADO - slide down do header, staggers de widgets, dragovers de colunas, glows da timeline)
    *   `src/views/DailyReview.jsx` (ATUALIZADO - staggers estatísticos e relatórios)
    *   `src/views/Inbox.jsx` (ATUALIZADO - cascateamento de widgets e itens recentes)
    *   `src/views/Brainstorm.jsx` (ATUALIZADO - zonas de drop elástico no Kanban, nós de timeline monitorados por IntersectionObserver)
*   **Especificações do Motion System:**
    *   **Motion Tokens de Easing:**
        *   `--duration-fast` (`150ms`): Ações e respostas visuais imediatas.
        *   `--duration-normal` (`250ms`): Entradas gerais e hover states.
        *   `--duration-medium` (`400ms`): Encerramentos elásticos de cards e salvamentos.
        *   `--duration-slow` (`600ms`): Modais complexos e morphs de IA.
        *   `--ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`): Curva premium de desaceleração ultra-suave.
        *   `--ease-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`): Curva elástica para respostas táteis e solturas.
    *   **Captura de Voz em 4 Estados Físicos:**
        1.  *Escutando (Listening):* Ondas subindo e descendo com mic envolto em um glow respirante HSL (`rgba(59, 130, 246, 0.35)`).
        2.  *Processando (Processing):* Recolhimento das ondas em barras cinzas estáticas e spinner de carregamento local.
        3.  *Transcrevendo (Transcribing):* Transcrição simulada surgindo letra por letra na tela sob ícone de Sparkles pulsante.
        4.  *Salvando (Saving):* Contração elástica da entrada sinalizando a conclusão da transcrição.
    *   **Shared Element Morphing (Ideia ➔ Tarefa):** O modal de decomposição da IA expande-se a partir de um centro focal comprimido e projeta uma barra de energia superior (`aiEnergyBeam`) e ondas pulsantes de raciocínio. Ao concluir, os campos sugeridos do editor de rascunhos surgem em cascata stagger deslizante.
    *   **Staggers de Dashboard e Balanço:** Todos os painéis estatísticos e linhas de atividades e conquistas entram na viewport ordenadamente a cada `80ms` (de `.stagger-1` a `.stagger-8`), resultando em um carregamento leve e premium.
    *   **Kanban Drag & Drop Elástico:** Os cartões ganham inclinação física de `-2deg` e redução de opacidade ao serem suspensos, as colunas alvo acendem suavemente com glows cianos nas bordas, e a soltura do drag assenta o card com amortecimento elástico (`--ease-spring`).
    *   **Estados do Sistema Polidos:** Loading skeletons suaves, Toasts elásticos de alertas críticos e feedbacks táteis robustos em todas as interações.

### Etapa 4 — Backend + Banco + Persistência + Sincronização + Notificações
*   **Data:** 23 de Maio de 2026
*   **Itens criados:** Arquitetura completa de persistência offline e local-first com IndexedDB (Dexie.js v2), camada de repositórios acoplada com regras estritas de validação, camada de serviços pura, sincronização em lote assíncrona tolerante a falhas com resolução Last Write Wins (LWW), scanner contínuo de segundo plano para disparos periódicos e acoplamento reativo com React Contexts.
*   **Arquivos adicionados/modificados:**
    *   `src/database/db.js` (ATUALIZADO - migração para v2, 11 tabelas modulares, injeção de preferências/usuário)
    *   `src/repositories/ideaRepository.js` (NOVO - CRUD e validações estritas de ideias)
    *   `src/repositories/taskRepository.js` (NOVO - CRUD e validações estritas de tarefas)
    *   `src/repositories/checklistRepository.js` (NOVO - persistência e auto-ordenação de checklists)
    *   `src/repositories/tagRepository.js` (NOVO - controle transacional de etiquetas)
    *   `src/repositories/notificationRepository.js` (NOVO - agendamento de alertas e auditoria)
    *   `src/repositories/reviewRepository.js` (NOVO - logs das triagens de revisões periódicas)
    *   `src/services/userPreferenceService.js` (NOVO - controle de preferências globais e individuais)
    *   `src/services/syncService.js` (NOVO - motor offline, fila `sync_queue` e resolução LWW)
    *   `src/services/notificationService.js` (NOVO - loop de background, alarmes de ociosidade, prazos e revisões)
    *   `src/services/reminderService.js` (ATUALIZADO - motor puro para envio Push nativo do SO)
    *   `src/services/ideaService.js` (NOVO - orquestrador de ideias com IA assíncrona e syncs)
    *   `src/services/taskService.js` (NOVO - orquestrador de conversão de ideias em tarefas)
    *   `src/services/checklistService.js` (NOVO - orquestrador de sub-tarefas)
    *   `src/services/tagService.js` (NOVO - orquestrador de etiquetas)
    *   `src/services/reviewService.js` (NOVO - orquestrador de compilados estatísticos)
    *   `src/services/storageService.js` (NOVO - motor de apoio e controle de quota)
    *   `src/store/IdeasContext.jsx` (ATUALIZADO - integração total com `ideaService` e sincronização)
    *   `src/store/TasksContext.jsx` (ATUALIZADO - integração total com `taskService` e checklists)
    *   `src/store/ThemeContext.jsx` (ATUALIZADO - integração com preferências de tema via `userPreferenceService`)
    *   `src/views/Settings.jsx` (ATUALIZADO - vinculação síncrona dos controles com preferências do IndexedDB)
    *   `src/components/layout/layout.css` (ATUALIZADO - novas regras responsivas de cabeçalho e eliminação de wrap/overlaps)
    *   `src/components/ideas/ideas.css` (ATUALIZADO - segmented controls roláveis por swipe lateral, empilhamento do dock de captura e mapa mental radial auto-dimensionável)
    *   `src/views/views.css` (ATUALIZADO - alinhamento tátil e empilhamento vertical do painel de ajustes no mobile)
    *   `src/components/common/common.css` (ATUALIZADO - modais responsivos com cabeçalho/rodapé fixados e área interna scrollable)
*   **Decisões Arquiteturais & Robustez:**
    *   **Isolamento Transacional:** Adotar o padrão Repository-Service previne vazamento de queries de banco de dados diretamente nos componentes de UI, permitindo substituir o Dexie por um driver nativo de banco móvel futuramente sem reescrever o front-end.
    *   **Robustez de Validações:** Os validadores de repositório asseguram que títulos e conteúdos não-nulos entrem no IndexedDB, emitindo avisos amigáveis e prevenindo corrupção de estado. Suporte duplo a strings de status/prioridade em inglês e português garante retrocompatibilidade com views da Etapa 3.
    *   **Simulador de Rede & LWW:** O status da rede (`navigator.onLine`) gerencia a conectividade. Modificações offline gravam tarefas na fila `sync_queue` sob estado `pending` com carimbo `updatedAt` e `deviceId`. Ao reconectar, a sincronização do lote simula latência com a nuvem e resolve conflitos pelo critério Last Write Wins (LWW), atualizando as tags visuais do Header.
    *   **Scanner em Background:** O loop contínuo monitorado via `setInterval` roda a cada 30 segundos no cliente reativo, varrendo o banco IndexedDB por ideias paradas no Inbox (ociosidade maior que o configurado, ex: 4 horas) ou tarefas próximas do deadline, emitindo Toasts e alertas no SO.
    *   **Polimento de Responsividade Premium:**
        *   *Header Estável:* Ocultamos o subtítulo longo `.header-subtitle` e os marcadores estáticos de contagem `.header-stat-tag` em telas menores que `768px`. O cabeçalho se mantém perfeitamente alinhado em uma única linha a 70px de altura, eliminando overlaps.
        *   *Dock e Ajustes Inteligentes:* O dock de captura e as linhas do painel de ajustes empilham-se em coluna única em telas pequenas para maximizar o espaço tátil de digitação e controle.
        *   *Swipes em Abas:* Os controles segmentados de visualização (`.segmented-control`) passam a usar rolagem horizontal elástica no mobile para evitar compressão forçada ou quebra de blocos.
        *   *Modais e Diálogos Inteligentes:* Modais longos de triagem e rascunhos de tarefas geradas por IA (`AIPreviewModal.jsx`) agora possuem dimensões adaptáveis à tela (`max-height`) e barra de rolagem embutida exclusivamente na seção central (`.modal-body`), mantendo os botões de ação do rodapé sempre visíveis e fáceis de acionar.



