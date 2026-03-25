# 🏢 Virtual Office — Heiven Revenue Machine

Escritório virtual sci-fi para operar agentes de IA. Command center com mapa de estações, chat por agente e HUD em tempo real.

## Setup

```bash
npm install
npm start
```

## Deploy (Vercel)

Push pro GitHub → conecta no Vercel → deploy automático a cada push.

## Estrutura

```
src/
├── App.js              # Entry point
└── VirtualOffice.jsx   # Componente principal (tudo aqui por enquanto)
```

## Editando no Cursor

1. Abra a pasta no Cursor
2. Edite `src/VirtualOffice.jsx`
3. O hot-reload mostra mudanças instantaneamente em `localhost:3000`
4. Commita e push → Vercel deploya automaticamente

## Paleta (objeto C no topo do VirtualOffice.jsx)

| Variável | Cor | Uso |
|----------|-----|-----|
| `cyan` | `#00F0FF` | Agente ativo, accent principal |
| `blue` | `#2563EB` | Heiven CRM |
| `purple` | `#8B5CF6` | Content AI |
| `amber` | `#F59E0B` | Sentinel Analytics |
| `green` | `#00E5A0` | Status online, sucesso |
| `red` | `#EF4444` | Erros, offline |

## Roadmap

- [x] Mapa de estações com nós clicáveis
- [x] Chat por agente com sugestões e respostas simuladas
- [x] HUD com status de sistemas
- [ ] Boot sequence animado
- [ ] Notificações toast
- [ ] WebSocket → CLAUDIN ADS (Railway)
- [ ] Chat real via API Anthropic
- [ ] CrewAI como orquestrador multi-agente
