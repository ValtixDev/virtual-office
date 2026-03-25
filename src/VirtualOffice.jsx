import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#030810", surface: "#0A1020", surface2: "#0F1A2E", surface3: "#141E35",
  border: "#1A2744", borderLight: "#243352",
  cyan: "#00F0FF", blue: "#2563EB", purple: "#8B5CF6", green: "#00E5A0",
  amber: "#F59E0B", red: "#EF4444", magenta: "#EC4899",
  text: "#E2E8F0", textDim: "#4A5568", textMid: "#8896AB",
};

const AGENTS = [
  {
    id: "claudin-ads", name: "CLAUDIN ADS", role: "Meta Ads Manager", status: "online",
    color: C.cyan, icon: "◈", x: 50, y: 38,
    metrics: { leads: 12, cpl: "R$71", spend: "R$1.357", roas: "4.2x" },
    lastAction: "Pausou campanha Lookalike — CPL acima do limite",
    tasks: 3, uptime: "99.7%",
    desc: "Gerencia campanhas Meta Ads de forma autônoma. Monitora CPL, frequência e budget.",
    greeting: "CLAUDIN ADS online. Gerenciando 3 campanhas ativas na conta act_1592...745. O que precisa?",
    suggestions: ["Status das campanhas", "Relatório de hoje", "Pausar tudo", "Métricas detalhadas"],
  },
  {
    id: "heiven-crm", name: "HEIVEN CRM", role: "Pipeline & Leads", status: "standby",
    color: C.blue, icon: "◇", x: 20, y: 62,
    metrics: { pipeline: "R$48k", contacts: 234, conversion: "18%", followups: 12 },
    lastAction: "Aguardando integração da API", tasks: 0, uptime: "—",
    desc: "Gerencia o pipeline comercial do Heiven. Cria contatos, qualifica leads, dispara follow-ups.",
    greeting: "HEIVEN CRM em standby. Integração com API pendente. Posso simular operações enquanto isso.",
    suggestions: ["Status do pipeline", "Leads recentes", "Simular follow-up", "Setup API"],
  },
  {
    id: "content-ai", name: "CONTENT AI", role: "Copy & Criativos", status: "standby",
    color: C.purple, icon: "◆", x: 80, y: 62,
    metrics: { created: 0, templates: 8, queue: 0, approved: 0 },
    lastAction: "Aguardando ativação", tasks: 0, uptime: "—",
    desc: "Produz copies para anúncios, headlines, descrições e criativos adaptados por canal.",
    greeting: "CONTENT AI em standby. 8 templates carregados. Pronto pra gerar quando ativado.",
    suggestions: ["Gerar headline", "Ver templates", "Copy para Meta", "Variações A/B"],
  },
  {
    id: "sentinel", name: "SENTINEL", role: "Analytics & Reports", status: "standby",
    color: C.amber, icon: "◊", x: 50, y: 80,
    metrics: { reports: 0, alerts: 0, dashboards: 1, anomalies: 0 },
    lastAction: "Aguardando ativação", tasks: 0, uptime: "—",
    desc: "Monitora métricas cross-agente, gera relatórios consolidados e detecta anomalias.",
    greeting: "SENTINEL em standby. Monitoramento passivo ativo. Sem anomalias detectadas.",
    suggestions: ["Relatório geral", "Anomalias", "KPIs do dia", "Comparar períodos"],
  },
];

// ── MOCK RESPONSES ──
const MOCK_RESPONSES = {
  "claudin-ads": {
    "Status das campanhas": "📊 3 campanhas na conta:\n\n✅ Lead Gen Imobiliárias SP — R$847 gasto, 12 leads, CPL R$70.61 ↓\n✅ Retargeting Site — R$312 gasto, 5 leads, CPL R$62.50 →\n⛔ Lookalike Converters — PAUSADA, CPL R$198 (limite: R$150)",
    "Relatório de hoje": "📋 Relatório 24/03:\n\nGasto total: R$1.357,80\nLeads: 12 | CPL médio: R$71\nROAS estimado: 4.2x (ticket R$700)\nMelhor campanha: Retargeting (CPL R$62)\nAção: Lookalike pausada às 17:42",
    "Pausar tudo": "⚠️ Confirma pausa de TODAS as campanhas ativas? Isso interrompe a geração de leads. Digite 'CONFIRMAR' para executar.",
    "Métricas detalhadas": "📈 Detalhamento por campanha:\n\nLead Gen SP: Freq 1.4x | CTR 2.1% | CPC R$3.40 | Impressões 24.8k\nRetargeting: Freq 1.8x | CTR 3.2% | CPC R$2.10 | Impressões 14.9k\nLookalike: Freq 2.9x | CTR 0.8% | CPC R$6.20 | PAUSADA",
    default: "Entendido. Processando sua solicitação... Posso ajudar com status, relatórios, pausas ou métricas das campanhas ativas.",
  },
  default: {
    default: "Agente em standby. Esta funcionalidade será ativada quando a integração estiver completa.",
  },
};

function getResponse(agentId, msg) {
  const agentResponses = MOCK_RESPONSES[agentId] || MOCK_RESPONSES.default;
  return agentResponses[msg] || agentResponses.default || "Processando...";
}

// ── CONNECTION LINES ──
function ConnectionLines({ agents, selected }) {
  const center = agents[0];
  const others = agents.slice(1);
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {others.map((agent, i) => {
        const on = agent.status === "online";
        const sel = selected === agent.id || selected === center.id;
        return (
          <g key={agent.id}>
            <line x1={`${center.x}%`} y1={`${center.y}%`} x2={`${agent.x}%`} y2={`${agent.y}%`}
              stroke={on ? agent.color : C.border} strokeWidth={sel ? 1.5 : 0.7}
              strokeDasharray={on ? "none" : "4 8"} opacity={on ? 0.3 : 0.1} filter={sel ? "url(#glow)" : "none"} />
            {on && <circle r="2" fill={agent.color} filter="url(#glow)">
              <animateMotion dur={`${3 + i}s`} repeatCount="indefinite" path={`M${center.x * 8},${center.y * 5} L${agent.x * 8},${agent.y * 5}`} />
            </circle>}
          </g>
        );
      })}
      {others.map((a, i) => others.slice(i + 1).map(b => (
        <line key={`${a.id}-${b.id}`} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`}
          stroke={C.border} strokeWidth="0.3" strokeDasharray="2 12" opacity="0.06" />
      )))}
    </svg>
  );
}

// ── AGENT NODE ──
function AgentNode({ agent, isSelected, onClick }) {
  const on = agent.status === "online";
  return (
    <div onClick={onClick} style={{
      position: "absolute", left: `${agent.x}%`, top: `${agent.y}%`,
      transform: "translate(-50%, -50%)", zIndex: isSelected ? 20 : 10, cursor: "pointer",
    }}>
      {on && <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: isSelected ? 115 : 90, height: isSelected ? 115 : 90, borderRadius: "50%",
        border: `1px solid ${agent.color}`, opacity: 0.15, animation: "ringPulse 3s ease-in-out infinite",
      }} />}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: isSelected ? 90 : 68, height: isSelected ? 90 : 68, borderRadius: "50%",
        background: `radial-gradient(circle, ${agent.color}${on ? "14" : "06"} 0%, transparent 70%)`,
        transition: "all 0.4s",
      }} />
      <div style={{
        width: isSelected ? 72 : 58, height: isSelected ? 72 : 58,
        borderRadius: isSelected ? 16 : 29,
        background: isSelected ? `linear-gradient(135deg, ${C.surface2}, ${C.surface})` : C.surface,
        border: `1.5px solid ${on ? agent.color + "55" : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: on ? `0 0 ${isSelected ? 28 : 10}px ${agent.color}18` : "none",
        position: "relative", overflow: "hidden",
      }}>
        {on && <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(180deg, transparent, ${agent.color}06, transparent)`,
          animation: "scanLine 4s linear infinite", pointerEvents: "none",
        }} />}
        <span style={{
          fontSize: isSelected ? 22 : 17, color: on ? agent.color : C.textDim,
          filter: on ? `drop-shadow(0 0 6px ${agent.color}55)` : "none", transition: "all 0.3s",
        }}>{agent.icon}</span>
      </div>
      <div style={{
        position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
        marginTop: 8, textAlign: "center", whiteSpace: "nowrap",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: on ? agent.color : C.textMid,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5,
          textShadow: on ? `0 0 10px ${agent.color}33` : "none",
        }}>{agent.name}</div>
        <div style={{ fontSize: 8, color: C.textDim, marginTop: 1, fontFamily: "'JetBrains Mono', monospace" }}>{agent.role}</div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4,
          fontSize: 7, color: on ? C.green : C.textDim,
          fontFamily: "'JetBrains Mono', monospace",
          background: on ? `${C.green}12` : `${C.textDim}10`, padding: "2px 7px", borderRadius: 10, letterSpacing: 1,
        }}>
          {on && <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />}
          {on ? "ONLINE" : "STANDBY"}
        </div>
      </div>
    </div>
  );
}

// ── CHAT MESSAGE ──
function ChatMsg({ msg, color }) {
  const isUser = msg.from === "user";
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
      animation: "msgIn 0.25s ease",
    }}>
      <div style={{
        fontSize: 8, color: isUser ? C.textDim : color, marginBottom: 3,
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
      }}>
        {isUser ? "VOCÊ" : msg.agentName} · {msg.time}
      </div>
      <div style={{
        maxWidth: "88%", padding: "9px 13px",
        background: isUser ? `${color}12` : C.surface2,
        border: `1px solid ${isUser ? color + "25" : C.border}`,
        borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
        fontSize: 12, color: C.text, lineHeight: 1.55, whiteSpace: "pre-wrap",
        fontFamily: isUser ? "inherit" : "'JetBrains Mono', monospace",
        fontSize: isUser ? 12.5 : 11.5,
      }}>
        {msg.text}
      </div>
    </div>
  );
}

// ── AGENT CHAT PANEL ──
function AgentChat({ agent, onClose, chatHistory, onSend }) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const on = agent.status === "online";

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [chatHistory, isTyping]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [agent.id]);

  const handleSend = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    onSend(agent.id, msg);
    setIsTyping(true);
    setTimeout(() => {
      const resp = getResponse(agent.id, msg);
      onSend(agent.id, resp, true);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  const history = chatHistory[agent.id] || [];

  return (
    <div style={{
      position: "absolute", right: 16, top: 68, bottom: 52, width: 370,
      background: `${C.bg}F5`, backdropFilter: "blur(30px)",
      border: `1px solid ${agent.color}22`, borderRadius: 18,
      zIndex: 50, display: "flex", flexDirection: "column",
      animation: "panelSlide 0.35s cubic-bezier(0.16,1,0.3,1)", overflow: "hidden",
    }}>
      {/* Accent */}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`, flexShrink: 0 }} />

      {/* Header */}
      <div style={{
        padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `${agent.color}12`, border: `1px solid ${agent.color}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: agent.color, filter: `drop-shadow(0 0 4px ${agent.color}44)`,
          }}>{agent.icon}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>{agent.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: on ? C.green : C.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: on ? C.green : C.textDim, animation: on ? "pulse 2s infinite" : "none" }} />
              {on ? "OPERANDO" : "STANDBY"} · {agent.tasks} tasks
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`,
            background: "transparent", color: C.textDim, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>×</button>
        </div>
      </div>

      {/* Metrics bar */}
      <div style={{
        padding: "8px 18px", borderBottom: `1px solid ${C.border}`,
        display: "flex", gap: 6, overflowX: "auto", flexShrink: 0,
      }}>
        {Object.entries(agent.metrics).map(([k, v]) => (
          <div key={k} style={{
            padding: "4px 10px", borderRadius: 6, background: C.surface2,
            border: `1px solid ${C.border}`, whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ fontSize: 8, color: C.textDim, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.8, textTransform: "uppercase" }}>{k}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: on ? C.text : C.textDim, fontFamily: "'Space Grotesk', sans-serif" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div ref={messagesRef} style={{
        flex: 1, overflow: "auto", padding: "14px 18px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {/* Greeting */}
        <div style={{
          padding: "10px 14px", borderRadius: 12, background: `${agent.color}08`,
          border: `1px solid ${agent.color}15`, marginBottom: 4,
        }}>
          <div style={{ fontSize: 8, color: agent.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5, marginBottom: 4 }}>SYSTEM INIT</div>
          <div style={{ fontSize: 11.5, color: C.textMid, lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace" }}>{agent.greeting}</div>
        </div>

        {history.map((msg, i) => <ChatMsg key={i} msg={msg} color={agent.color} />)}

        {isTyping && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 0",
          }}>
            <div style={{ fontSize: 8, color: agent.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>{agent.name}</div>
            <div style={{ display: "flex", gap: 3 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 4, height: 4, borderRadius: "50%", background: agent.color,
                  animation: `pulse 1s ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div style={{
        padding: "6px 18px 4px", display: "flex", gap: 5, flexWrap: "wrap", flexShrink: 0,
      }}>
        {agent.suggestions.map((s, i) => (
          <button key={i} onClick={() => handleSend(s)} style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 10,
            background: `${agent.color}08`, border: `1px solid ${agent.color}18`,
            color: agent.color, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
            transition: "all 0.2s", letterSpacing: 0.3,
          }}>{s}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 14px", borderTop: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: C.surface2, borderRadius: 10, padding: "8px 12px",
          border: `1px solid ${C.border}`,
        }}>
          <span style={{ color: agent.color, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>›</span>
          <input ref={inputRef} value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite um comando..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: C.text, fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
            }} />
          <button onClick={() => handleSend()} style={{
            background: input.trim() ? agent.color : "transparent",
            border: input.trim() ? "none" : `1px solid ${C.border}`,
            borderRadius: 6, width: 28, height: 28, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: input.trim() ? "#000" : C.textDim, fontSize: 13, fontWeight: 700,
            transition: "all 0.2s",
          }}>→</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──
export default function VirtualOffice() {
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState(new Date());
  const [chatHistory, setChatHistory] = useState({});

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSend = (agentId, text, isAgent = false) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const agent = AGENTS.find(a => a.id === agentId);
    setChatHistory(prev => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), {
        from: isAgent ? "agent" : "user",
        agentName: agent.name,
        text, time: timeStr,
      }],
    }));
  };

  const selectedAgent = AGENTS.find(a => a.id === selected);
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i, x: Math.random() * 100, size: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 25 + 20, delay: Math.random() * 12, opacity: Math.random() * 0.25 + 0.05,
  }));

  return (
    <div style={{ background: C.bg, width: "100%", height: "100vh", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes ringPulse{0%{transform:translate(-50%,-50%) scale(.8);opacity:.2}100%{transform:translate(-50%,-50%) scale(1.5);opacity:0}}
        @keyframes scanLine{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
        @keyframes panelSlide{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes particleFloat{0%{transform:translateY(100vh);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-10vh);opacity:0}}
        @keyframes gridScroll{0%{transform:translate(0,0)}100%{transform:translate(40px,40px)}}
        @keyframes hScan{0%{transform:translateY(-50%) scaleX(0);opacity:0}50%{transform:translateY(-50%) scaleX(1);opacity:1}100%{transform:translateY(-50%) scaleX(0);opacity:0}}
        @keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        button:hover{filter:brightness(1.2)}
        input::placeholder{color:${C.textDim}}
      `}</style>

      {/* Grid bg */}
      <div style={{
        position: "absolute", inset: -40, opacity: 0.025,
        backgroundImage: `linear-gradient(${C.cyan} 1px, transparent 1px), linear-gradient(90deg, ${C.cyan} 1px, transparent 1px)`,
        backgroundSize: "40px 40px", animation: "gridScroll 25s linear infinite", pointerEvents: "none",
      }} />
      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 40%, transparent 25%, ${C.bg} 75%)`, pointerEvents: "none", zIndex: 2 }} />
      {/* Scan */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: "50%", height: 1,
        background: `linear-gradient(90deg, transparent, ${C.cyan}12, transparent)`,
        animation: "hScan 8s ease-in-out infinite", pointerEvents: "none", zIndex: 3,
      }} />
      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, bottom: "-5%",
          width: p.size, height: p.size, borderRadius: "50%", background: C.cyan,
          opacity: p.opacity, animation: `particleFloat ${p.speed}s linear ${p.delay}s infinite`,
          pointerEvents: "none", zIndex: 1,
        }} />
      ))}

      {/* ── TOP HUD ── */}
      <header style={{
        position: "absolute", top: 0, left: 0, right: 0, padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 30, background: `linear-gradient(180deg, ${C.bg}DD, transparent)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="32" height="32" viewBox="0 0 36 36">
            <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" fill="none" stroke={C.cyan} strokeWidth="1" opacity="0.5" />
            <polygon points="18,8 27,13 27,23 18,28 9,23 9,13" fill={`${C.cyan}10`} stroke={C.cyan} strokeWidth="0.6" opacity="0.7" />
            <text x="18" y="22" textAnchor="middle" fill={C.cyan} fontSize="11" fontWeight="700" fontFamily="Space Grotesk">V</text>
          </svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: 2 }}>VIRTUAL OFFICE</div>
            <div style={{ fontSize: 8, color: C.textDim, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 3 }}>HEIVEN — REVENUE MACHINE</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontFamily: "'JetBrains Mono', monospace" }}>
          {[
            { label: "AGENTES", value: `${AGENTS.filter(a => a.status === "online").length}/${AGENTS.length}`, color: C.cyan },
            { label: "PENDENTES", value: "2", color: C.purple },
            { label: "TASKS", value: String(AGENTS.reduce((s, a) => s + a.tasks, 0)), color: C.green },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 7, color: C.textDim, letterSpacing: 2, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
              {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ fontSize: 8, color: C.textDim, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
              {time.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
            </div>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: 10, border: `1.5px solid ${C.cyan}33`,
            background: C.surface, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: C.cyan, fontFamily: "'Space Grotesk', sans-serif",
          }}>D</div>
        </div>
      </header>

      {/* ── BOTTOM HUD ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 24px",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        zIndex: 30, background: `linear-gradient(0deg, ${C.bg}EE, transparent)`,
      }}>
        <div style={{ fontSize: 8, color: C.textDim, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5, display: "flex", gap: 12 }}>
          {[
            { name: "RAILWAY", ok: true }, { name: "META API", ok: true },
            { name: "TELEGRAM", ok: true }, { name: "HEIVEN API", ok: false },
          ].map((s, i) => (
            <span key={i}><span style={{ color: s.ok ? C.green : C.red }}>●</span> {s.name}</span>
          ))}
        </div>
        <div style={{ fontSize: 8, color: `${C.cyan}30`, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 3 }}>
          {selected ? "CLIQUE NO CHAT PARA INTERAGIR" : "CLIQUE EM UMA ESTAÇÃO PARA ABRIR"}
        </div>
        <div style={{ fontSize: 8, color: C.textDim, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5, textAlign: "right" }}>
          MACEIÓ — AL · v0.2.0
        </div>
      </div>

      {/* ── CONNECTIONS ── */}
      <ConnectionLines agents={AGENTS} selected={selected} />

      {/* ── AGENT MAP ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10 }}
        onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
        {AGENTS.map(agent => (
          <AgentNode key={agent.id} agent={agent} isSelected={selected === agent.id}
            onClick={(e) => { e.stopPropagation(); setSelected(selected === agent.id ? null : agent.id); }} />
        ))}
        <div style={{
          position: "absolute", left: "50%", top: "56%", transform: "translate(-50%,-50%)",
          textAlign: "center", pointerEvents: "none", zIndex: 5,
        }}>
          <div style={{ fontSize: 7, color: `${C.cyan}25`, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 5 }}>── COMMAND CENTER ──</div>
        </div>
      </div>

      {/* ── CHAT PANEL ── */}
      {selectedAgent && (
        <AgentChat
          agent={selectedAgent}
          onClose={() => setSelected(null)}
          chatHistory={chatHistory}
          onSend={handleSend}
        />
      )}

      {/* Corners */}
      {[{ top: 8, left: 8 }, { top: 8, right: 8 }, { bottom: 8, left: 8 }, { bottom: 8, right: 8 }].map((pos, i) => (
        <svg key={i} width="18" height="18" style={{ position: "absolute", ...pos, zIndex: 30, opacity: 0.18 }}>
          <path d={i < 2 ? (i === 0 ? "M0,9 L0,0 L9,0" : "M9,0 L18,0 L18,9") : (i === 2 ? "M0,9 L0,18 L9,18" : "M9,18 L18,18 L18,9")}
            fill="none" stroke={C.cyan} strokeWidth="0.8" />
        </svg>
      ))}
    </div>
  );
}
