# CLAUDE.md — Regras do Projeto Mundo Invertido

## Sobre o Projeto
**Mundo Invertido** é o escritório virtual / command center do ecossistema **VALTIX**. É onde Daniel opera agentes de IA que gerenciam os produtos do ecossistema. O Heiven (CRM B2B para imobiliárias) é 1 produto dentro do ecossistema VALTIX — não é o centro, é um dos braços.

## Ecossistema VALTIX
- **VALTIX** = holding/ecossistema central (www.valtix.com.br)
- **Heiven** = CRM B2B para imobiliárias — produto principal em operação
- **Mundo Invertido** = escritório virtual para operar agentes de IA
- **CLAUDIN ADS** = primeiro agente ativo (gerencia Meta Ads no Railway)
- Outros agentes planejados: HEIVEN CRM Agent, CONTENT AI, SENTINEL

## Identidade Visual VALTIX
- **Logo:** Raio estilizado em formato V/double arrow (arquivo: `public/valtix-logo.svg`)
- **Cor principal:** `#7700C4` (roxo VALTIX — elétrico, profundo)
- **Background:** Preto puro `#000000` ou ultra dark `#050510`
- **Texto primário:** Branco `#FFFFFF` ou off-white `#E8E8F0`
- **Texto secundário:** `#6B6B80`
- **Accent secundário:** Variações do roxo — `#9333EA` (mais claro), `#5B00A0` (mais escuro)
- **Glow/Shadow:** Sempre roxo (`#7700C444`, `#7700C466`)
- **Tipografia do wordmark:** Sans-serif bold, letter-spacing muito largo (ex: V A L T I X)
- **Vibe geral:** Cybernético, dark, ambicioso, tech, poder, sci-fi

## Regras de Design
- SEMPRE dark mode. Nunca fundo claro. Background preto verdadeiro.
- Accent principal é ROXO `#7700C4`, não cyan, não azul
- Glows e shadows devem ser roxo (não cyan)
- Grid, partículas e efeitos sci-fi podem continuar, mas em roxo/violeta
- Labels: uppercase, letter-spacing 1.5-3, font-size 7-9px, fonte mono
- Métricas/números grandes: fonte sans-serif bold, weight 700
- Ícones via unicode/emoji, sem bibliotecas externas
- Tudo inline style (objeto JS), sem CSS externo
- Paleta centralizada no objeto `C` no topo do VirtualOffice.jsx
- Logo VALTIX (SVG) deve aparecer no header e na tela de login

## Paleta por Agente
- **CLAUDIN ADS:** `#7700C4` (roxo principal — é o agente ativo)
- **HEIVEN CRM:** `#2563EB` (azul)
- **CONTENT AI:** `#EC4899` (magenta/pink)
- **SENTINEL:** `#F59E0B` (amber)
- **Status online:** `#00E5A0` (verde)
- **Status offline/erro:** `#EF4444` (vermelho)

## Fontes
- **Dados/labels/mono:** JetBrains Mono
- **Títulos/números:** Space Grotesk
- **Corpo:** Inter

## Regras de Código
- React 18 funcional com hooks (useState, useEffect, useRef)
- Sem dependências externas além de React
- Tudo em `src/VirtualOffice.jsx` por enquanto
- Componentes internos ao arquivo (não separar sem pedir ao Daniel)
- Respostas simuladas no objeto `RESPONSES`
- Dados dos agentes no array `AGENTS_DATA`
- Hot reload via react-scripts

## Estrutura Atual
```
src/
├── App.js              → Importa VirtualOffice
├── index.js            → Entry point
└── VirtualOffice.jsx   → TUDO (componentes, dados, estilos)
public/
├── index.html          → HTML base
└── valtix-logo.svg     → Logo VALTIX
```

## O Que NÃO Fazer
- Não usar cyan como cor principal (era do protótipo antigo)
- Não usar Tailwind, styled-components, ou CSS modules
- Não criar fundos claros ou gradientes genéricos
- Não separar em múltiplos arquivos sem pedir ao Daniel
- Não adicionar dependências npm sem pedir ao Daniel
- Não remover efeitos visuais sem pedir
- Não mudar a paleta sem pedir
- Não chamar de "Virtual Office" — o nome é "Mundo Invertido"

## Próximas Features Planejadas
- Tela de login/início com branding VALTIX
- Setores no mapa (não só agentes soltos)
- Autenticação via Supabase (futuro)
- Chat por agente com IA real (API Anthropic)
- Backend no Railway conectando dados reais
