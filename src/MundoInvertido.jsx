import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

const C = {
  bg: "#050510", surface: "#0A0A1A", surface2: "#10102A",
  border: "#1E1E44",
  purple: "#7700C4", purpleBright: "#9333EA", purpleGlow: "#7700C444",
  green: "#00E5A0", red: "#EF4444", amber: "#F59E0B",
  text: "#E8E8F0", textDim: "#4A4A6A", textMid: "#8888AA",
};

const PROJECTS = [
  {
    id: "heiven", name: "HEIVEN", color: "#7700C4", status: "active",
    angle: 220, dist: 24,
    agents: [
      {
        id: "claudin-ads", name: "CLAUDIN ADS", role: "Meta Ads Manager", status: "online",
        color: "#7700C4", icon: "◈",
        metrics: { leads: 12, cpl: "R$71", spend: "R$1.357", roas: "4.2x" },
        tasks: 3, uptime: "99.7%",
        suggestions: ["Status das campanhas", "Relatório de hoje", "Pausar campanha", "Melhor criativo?"],
      },
    ],
  },
];


// ─── RADAR ───────────────────────────────────────────
function Radar({ onSelectProject }) {
  const [sweep, setSweep] = useState(0);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const i = setInterval(() => setSweep(p => (p + 1.2) % 360), 25);
    return () => clearInterval(i);
  }, []);

  const cx = 50, cy = 50;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
      <svg viewBox="0 0 100 100" style={{ width: "min(85vh, 85vw)", height: "min(85vh, 85vw)" }}>
        <defs>
          <filter id="gl"><feGaussianBlur stdDeviation="0.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="gl2"><feGaussianBlur stdDeviation="1" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <radialGradient id="rg" cx="50%" cy="50%">
            <stop offset="0%" stopColor={C.purple} stopOpacity="0.06" />
            <stop offset="100%" stopColor={C.purple} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r="48" fill="url(#rg)" />

        {[10, 20, 30, 40].map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={C.purple} strokeWidth="0.12" opacity={0.2 - i * 0.03}
            strokeDasharray="0.8 1.2" />
        ))}

        <circle cx={cx} cy={cy} r="44" fill="none" stroke={C.purple} strokeWidth="0.2" opacity="0.15" />
        <line x1={cx - 44} y1={cy} x2={cx + 44} y2={cy} stroke={C.purple} strokeWidth="0.06" opacity="0.12" />
        <line x1={cx} y1={cy - 44} x2={cx} y2={cy + 44} stroke={C.purple} strokeWidth="0.06" opacity="0.12" />
        <line x1={cx - 31} y1={cy - 31} x2={cx + 31} y2={cy + 31} stroke={C.purple} strokeWidth="0.04" opacity="0.07" />
        <line x1={cx + 31} y1={cy - 31} x2={cx - 31} y2={cy + 31} stroke={C.purple} strokeWidth="0.04" opacity="0.07" />

        {Array.from({ length: 72 }, (_, i) => {
          const a = (i * 5) * Math.PI / 180;
          const len = i % 6 === 0 ? 2.5 : 1;
          return (
            <line key={i}
              x1={cx + Math.cos(a) * (44 - len)} y1={cy + Math.sin(a) * (44 - len)}
              x2={cx + Math.cos(a) * 44} y2={cy + Math.sin(a) * 44}
              stroke={C.purple} strokeWidth={i % 6 === 0 ? "0.15" : "0.06"}
              opacity={i % 6 === 0 ? 0.3 : 0.15} />
          );
        })}

        {[{ label: "000", a: -90 }, { label: "090", a: 0 }, { label: "180", a: 90 }, { label: "270", a: 180 }].map((d, i) => {
          const rad = d.a * Math.PI / 180;
          return (
            <text key={i} x={cx + Math.cos(rad) * 47} y={cy + Math.sin(rad) * 47 + 0.5}
              textAnchor="middle" fill={C.textDim} fontSize="1.4" fontFamily="'JetBrains Mono'" fontWeight="600">
              {d.label}
            </text>
          );
        })}

        {/* Sweep */}
        <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${sweep}deg)` }}>
          {[0.08, 0.16, 0.24].map((a, i) => (
            <line key={i} x1={cx} y1={cy}
              x2={cx + Math.cos(-a) * 43} y2={cy + Math.sin(-a) * 43}
              stroke={C.purple} strokeWidth="0.1" opacity={0.15 - i * 0.04} />
          ))}
          <line x1={cx} y1={cy} x2={cx + 43} y2={cy}
            stroke={C.purpleBright} strokeWidth="0.2" opacity="0.6" filter="url(#gl)" />
          <path d={`M${cx},${cy} L${cx + 43 * Math.cos(-0.12)},${cy + 43 * Math.sin(-0.12)} A43,43 0 0,1 ${cx + 43},${cy} Z`}
            fill={C.purple} opacity="0.08" />
        </g>

        <circle cx={cx} cy={cy} r="0.6" fill={C.purple} opacity="0.5" filter="url(#gl)" />
        <circle cx={cx} cy={cy} r="0.25" fill={C.purpleBright} opacity="0.8" />

        {/* Project blips */}
        {PROJECTS.map((proj) => {
          const rad = proj.angle * Math.PI / 180;
          const px = cx + Math.cos(rad) * proj.dist;
          const py = cy + Math.sin(rad) * proj.dist;
          const active = proj.status === "active";
          const isHover = hover === proj.id;

          return (
            <g key={proj.id}
              style={{ cursor: active ? "pointer" : "default" }}
              onClick={() => active && onSelectProject(proj.id)}
              onMouseEnter={() => active && setHover(proj.id)}
              onMouseLeave={() => setHover(null)}>

              {active && (
                <>
                  <circle cx={px} cy={py} r="1" fill="none" stroke={proj.color} strokeWidth="0.1" opacity="0.4">
                    <animate attributeName="r" values="0.5;4" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={px} cy={py} r="0.5" fill="none" stroke={proj.color} strokeWidth="0.08" opacity="0.3">
                    <animate attributeName="r" values="0.3;3" dur="3s" begin="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0" dur="3s" begin="1s" repeatCount="indefinite" />
                  </circle>
                </>
              )}

              <rect x={px - 3} y={py - 3} width="6" height="6" fill="none"
                stroke={proj.color} strokeWidth={isHover ? "0.2" : "0.1"}
                opacity={active ? (isHover ? 0.7 : 0.3) : 0.15} rx="0.3"
                style={{ transition: "all 0.3s" }}>
                {isHover && active && <animate attributeName="opacity" values="0.7;0.4;0.7" dur="1.5s" repeatCount="indefinite" />}
              </rect>

              <circle cx={px} cy={py} r={isHover ? 1 : 0.7} fill={proj.color}
                filter="url(#gl2)" opacity={active ? 1 : 0.3}
                style={{ transition: "r 0.3s" }}>
                {active && <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />}
              </circle>

              <text x={px} y={py - 4.5} textAnchor="middle" fill={proj.color}
                fontSize="1.6" fontFamily="'JetBrains Mono'" fontWeight="700"
                letterSpacing="0.12" filter={active ? "url(#gl)" : "none"} opacity={active ? 1 : 0.4}>
                {proj.name}
              </text>
              <text x={px} y={py + 5} textAnchor="middle"
                fill={active ? C.green : C.textDim}
                fontSize="0.8" fontFamily="'JetBrains Mono'" letterSpacing="0.1">
                {active ? "● ONLINE" : "○ EM BREVE"}
              </text>

              {isHover && active && (
                <text x={px} y={py + 6.5} textAnchor="middle" fill={proj.color}
                  fontSize="0.75" fontFamily="'JetBrains Mono'" letterSpacing="0.08" opacity="0.7">
                  [ ACESSAR ]
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── AGENT NODE ──────────────────────────────────────
function AgentNode({ agent, isSelected, onClick }) {
  const on = agent.status === "online";
  return (
    <div onClick={onClick} style={{
      position: "absolute", left: "50%", top: "44%",
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
          fontFamily: "'JetBrains Mono'", letterSpacing: 1.5,
        }}>{agent.name}</div>
        <div style={{ fontSize: 8, color: C.textDim, marginTop: 1, fontFamily: "'JetBrains Mono'" }}>{agent.role}</div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4,
          fontSize: 7, color: on ? C.green : C.textDim, fontFamily: "'JetBrains Mono'",
          background: on ? `${C.green}12` : `${C.textDim}10`, padding: "2px 7px", borderRadius: 10, letterSpacing: 1,
        }}>
          {on && <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />}
          {on ? "ONLINE" : "STANDBY"}
        </div>
      </div>
    </div>
  );
}

// ─── PROJECT VIEW ─────────────────────────────────────
function ProjectView({ project, onBack, onSelectAgent }) {
  const [selected, setSelected] = useState(null);

  if (project.agents.length === 0) {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 30, background: C.bg, display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 12, background: `${C.surface}DD`,
        }}>
          <button onClick={onBack} style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.surface2, color: C.textMid, cursor: "pointer",
            fontSize: 11, fontFamily: "'JetBrains Mono'",
          }}>← RADAR</button>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk'", letterSpacing: 1 }}>{project.name}</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.15, color: C.textDim }}>◇</div>
            <div style={{ fontSize: 9, color: C.textDim, fontFamily: "'JetBrains Mono'", letterSpacing: 2 }}>NENHUM AGENTE ATIVO</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30, background: C.bg,
      animation: "zoomIn 0.45s cubic-bezier(0.16,1,0.3,1)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 12,
        background: `${C.surface}DD`, flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
          background: C.surface2, color: C.textMid, cursor: "pointer",
          fontSize: 11, fontFamily: "'JetBrains Mono'",
        }}>← RADAR</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk'", letterSpacing: 1 }}>{project.name}</div>
      </div>

      <div style={{ flex: 1, position: "relative" }}
        onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>

        {project.agents.map(agent => (
          <AgentNode key={agent.id} agent={agent} isSelected={selected === agent.id}
            onClick={(e) => { e.stopPropagation(); setSelected(selected === agent.id ? null : agent.id); }} />
        ))}

        {/* New agent placeholder */}
        <div style={{
          position: "absolute", left: "50%", top: "68%",
          transform: "translate(-50%, -50%)", zIndex: 5, textAlign: "center",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 26, margin: "0 auto",
            border: `1.5px dashed ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", opacity: 0.35, transition: "opacity 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.65}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.35}>
            <span style={{ fontSize: 18, color: C.textDim }}>+</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 8, color: C.textDim, fontFamily: "'JetBrains Mono'", letterSpacing: 1, whiteSpace: "nowrap" }}>
            NOVO AGENTE
          </div>
        </div>

        {selected && (
          <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
            <button
              onClick={() => onSelectAgent(project.agents.find(a => a.id === selected))}
              style={{
                padding: "10px 28px", borderRadius: 10,
                border: `1px solid ${project.color}44`,
                background: `${project.color}15`, color: project.color,
                cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono'", letterSpacing: 2,
                animation: "msgIn 0.2s ease",
              }}>ACESSAR →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AGENT VIEW ──────────────────────────────────────
const INSIGHTS = [
  { type: "warn", text: "CTR do 'Vídeo 30s' está 0.8% — abaixo da média. Considere trocar o criativo." },
  { type: "ok", text: "'Carrossel CRM' performando bem — CPL R$52, abaixo do limite de R$90." },
  { type: "warn", text: "'Lead Gen Lookalike SP' pausada com frequência 2.9x e CPL R$198 — acima do limite." },
  { type: "info", text: "Budget total ativo: R$140/dia. Potencial de escalar 'Carrossel CRM' em +30%." },
];

const AD_METRIC_KEYS = ["spend","leads","cpl","ctr","cpc","cpm","impressions","reach","frequency","clicks","conversions","daily_budget"];

function AgentView({ agent, project, onBack }) {
  const [tab, setTab] = useState("chat");

  // Base de conhecimento
  const [kbText, setKbText] = useState("");
  const [kbLoading, setKbLoading] = useState(false);
  const [kbSaving, setKbSaving] = useState(false);
  const [toast, setToast] = useState(false);

  // Métricas
  const [campaigns, setCampaigns] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [metricsAccount, setMetricsAccount] = useState("ca2");

  // ── BASE DE CONHECIMENTO — carrega no mount ──
  useEffect(() => {
    setKbLoading(true);
    supabase
      .from("knowledge_base")
      .select("content")
      .eq("agent_id", "claudin-ads")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("[KB] select error:", error);
        else console.log("[KB] loaded:", data);
        setKbText(data?.content ?? "");
        setKbLoading(false);
      });
  }, []);

  const saveKb = async () => {
    setKbSaving(true);
    const { error } = await supabase
      .from("knowledge_base")
      .update({ content: kbText, updated_at: new Date().toISOString() })
      .eq("agent_id", "claudin-ads");
    if (error) console.error("[KB] update error:", error);
    else console.log("[KB] saved");
    setKbSaving(false);
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  // ── MÉTRICAS ──
  const fetchMetrics = async (account = metricsAccount) => {
    setMetricsLoading(true);
    setMetricsError(null);
    setCampaigns([]);
    try {
      const res = await fetch(`/api/meta-ads?account=${account}`);
      const data = await res.json();
      console.log("[Metrics] API response:", data);
      if (data.error) { setMetricsError(data.error); }
      else {
        console.log("[Metrics] campaigns loaded:", (data.campaigns ?? []).length);
        setCampaigns(data.campaigns ?? []);
      }
    } catch (err) {
      console.error("[Metrics] fetch error:", err.message);
      setMetricsError(err.message);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "metricas" && campaigns.length === 0 && !metricsLoading) fetchMetrics(metricsAccount);
  }, [tab]);

  // ── CHAT HISTORY — carrega no mount ──
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    supabase
      .from("chat_history")
      .select("role, message, created_at")
      .eq("agent_id", "claudin-ads")
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          console.error("[Chat] load error:", error);
          setMessages([{ from: "agent", text: "CLAUDIN ADS online. O que precisa?", time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }]);
        } else if (data && data.length > 0) {
          console.log("[Chat] loaded", data.length, "messages");
          setMessages(data.map(m => ({
            from: m.role === "user" ? "user" : "agent",
            text: m.message,
            time: new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          })));
        } else {
          setMessages([{ from: "agent", text: "CLAUDIN ADS online. O que precisa?", time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }]);
        }
        setChatLoading(false);
      });
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { if (!chatLoading) setTimeout(() => inputRef.current?.focus(), 100); }, [chatLoading]);

  const saveMessage = async (role, text) => {
    const { error } = await supabase
      .from("chat_history")
      .insert({ agent_id: "claudin-ads", role, message: text });
    if (error) console.error("[Chat] insert error:", error);
  };

  const send = async (text) => {
    if (!text.trim() || isTyping) return;
    const t = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { from: "user", text: text.trim(), time: t }]);
    setInput("");
    setIsTyping(true);
    saveMessage("user", text.trim());
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history: messages }),
      });
      const data = await res.json();
      const t2 = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      let rawReply = data.reply || "Erro ao processar resposta.";

      // Detecta bloco de ação <<<ACTION:{...}>>>
      const actionMatch = rawReply.match(/<<<ACTION:([\s\S]*?)>>>/);
      let actionResult = null;
      if (actionMatch) {
        rawReply = rawReply.replace(/<<<ACTION:[\s\S]*?>>>/, "").trim();
        try {
          const actionPayload = JSON.parse(actionMatch[1]);
          const actRes = await fetch("/api/meta-actions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(actionPayload),
          });
          const actData = await actRes.json();
          actionResult = { success: actData.success, action: actionPayload.action };
        } catch (err) {
          actionResult = { success: false, action: "unknown", error: err.message };
        }
      }

      setMessages(prev => [...prev, { from: "agent", text: rawReply, time: t2, savedToKb: data.saved_to_kb === true, actionResult }]);
      saveMessage("assistant", rawReply);
    } catch {
      const t2 = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [...prev, { from: "agent", text: "Falha na conexão com o backend.", time: t2 }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 40, background: C.bg,
      animation: "zoomIn 0.45s cubic-bezier(0.16,1,0.3,1)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `${C.surface}DD`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.surface2, color: C.textMid, cursor: "pointer",
            fontSize: 11, fontFamily: "'JetBrains Mono'", display: "flex", alignItems: "center", gap: 6,
          }}>← {project.name}</button>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: `${agent.color}15`, border: `1px solid ${agent.color}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: agent.color, filter: `drop-shadow(0 0 6px ${agent.color}44)`,
          }}>{agent.icon}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk'" }}>{agent.name}</div>
            <div style={{ fontSize: 9, color: C.green, fontFamily: "'JetBrains Mono'", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
              {agent.role} · online
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, fontFamily: "'JetBrains Mono'" }}>
          {[
            { l: "TASKS", v: String(agent.tasks), c: agent.color },
            { l: "UPTIME", v: agent.uptime, c: C.text },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 7, color: C.textDim, letterSpacing: 2, marginBottom: 2 }}>{m.l}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: m.c }}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {[{ id: "chat", label: "CHAT" }, { id: "metricas", label: "MÉTRICAS" }, { id: "base", label: "BASE" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "9px 0", background: "transparent", border: "none",
            borderBottom: tab === t.id ? `2px solid ${agent.color}` : "2px solid transparent",
            color: tab === t.id ? agent.color : C.textDim, cursor: "pointer",
            fontSize: 10, fontFamily: "'JetBrains Mono'", letterSpacing: 2,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Chat */}
      {tab === "chat" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflow: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {chatLoading && (
              <div style={{ fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono'", letterSpacing: 1, padding: "4px 0" }}>
                Carregando histórico...
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column",
                alignItems: m.from === "user" ? "flex-end" : "flex-start",
                animation: "msgIn 0.3s ease",
              }}>
                <div style={{
                  maxWidth: "85%", padding: "10px 14px", borderRadius: 12,
                  background: m.from === "user" ? `${agent.color}18` : C.surface2,
                  border: `1px solid ${m.from === "user" ? agent.color + "33" : C.border}`,
                  borderTopRightRadius: m.from === "user" ? 4 : 12,
                  borderTopLeftRadius: m.from === "user" ? 12 : 4,
                }}>
                  <div style={{
                    fontSize: m.from === "user" ? 12.5 : 11.5, color: C.text,
                    lineHeight: 1.6, whiteSpace: "pre-wrap",
                    fontFamily: m.from === "user" ? "'Inter'" : "'JetBrains Mono'",
                  }}>{m.text}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 9, color: C.textDim, fontFamily: "'JetBrains Mono'" }}>{m.time}</div>
                  {m.savedToKb && (
                    <div style={{ fontSize: 8, color: C.purple, fontFamily: "'JetBrains Mono'", letterSpacing: 0.5, opacity: 0.7 }}>💾 salvo na base</div>
                  )}
                  {m.actionResult && (
                    <div style={{
                      fontSize: 8, fontFamily: "'JetBrains Mono'", letterSpacing: 0.5,
                      padding: "2px 7px", borderRadius: 5,
                      background: m.actionResult.success ? `${C.green}18` : `${C.red}18`,
                      color: m.actionResult.success ? C.green : C.red,
                      border: `1px solid ${m.actionResult.success ? C.green : C.red}44`,
                    }}>
                      ⚡ {m.actionResult.success ? "Ação executada" : "Ação falhou"}: {m.actionResult.action}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
                <div style={{ display: "flex", gap: 3 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: "50%", background: agent.color,
                      animation: `pulse 1s ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 9, color: C.textDim, fontFamily: "'JetBrains Mono'", letterSpacing: 1 }}>digitando...</span>
              </div>
            )}
            <div ref={chatEnd} />
          </div>
          {messages.length <= 2 && (
            <div style={{ padding: "0 16px 8px", display: "flex", flexWrap: "wrap", gap: 5 }}>
              {agent.suggestions.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 11,
                  background: `${agent.color}0C`, border: `1px solid ${agent.color}25`,
                  color: agent.color, cursor: "pointer", fontFamily: "'JetBrains Mono'",
                }}>{s}</button>
              ))}
            </div>
          )}
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, flexShrink: 0 }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 8,
              background: C.surface2, borderRadius: 10, padding: "9px 12px", border: `1px solid ${C.border}`,
            }}>
              <span style={{ color: agent.color, fontSize: 14, fontFamily: "'JetBrains Mono'" }}>›</span>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send(input)} placeholder="Enviar comando..."
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 12, fontFamily: "'JetBrains Mono'" }} />
            </div>
            <button onClick={() => send(input)} style={{
              width: 36, height: 36, borderRadius: 10, background: `${agent.color}18`,
              border: `1px solid ${agent.color}33`, color: agent.color, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
            }}>↑</button>
          </div>
        </div>
      )}

      {/* Métricas */}
      {tab === "metricas" && (
        <div style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["ca2", "ca1"].map((acc) => {
                const active = metricsAccount === acc;
                return (
                  <button key={acc} disabled={metricsLoading} onClick={() => {
                    setMetricsAccount(acc);
                    fetchMetrics(acc);
                  }} style={{
                    padding: "5px 14px", borderRadius: 8, cursor: metricsLoading ? "default" : "pointer",
                    fontSize: 10, fontFamily: "'JetBrains Mono'", letterSpacing: 1.5,
                    border: `1px solid ${active ? C.purple : C.border}`,
                    background: active ? C.purple : "transparent",
                    color: active ? "#fff" : C.textDim,
                    fontWeight: active ? 700 : 400,
                    opacity: metricsLoading ? 0.5 : 1,
                  }}>{acc.toUpperCase().replace("CA", "CA-")}</button>
                );
              })}
            </div>
            <button onClick={() => fetchMetrics(metricsAccount)} disabled={metricsLoading} style={{
              padding: "6px 16px", borderRadius: 8, border: `1px solid ${C.purple}44`,
              background: `${C.purple}12`, color: C.purple, cursor: metricsLoading ? "default" : "pointer",
              fontSize: 10, fontFamily: "'JetBrains Mono'", letterSpacing: 1.5, opacity: metricsLoading ? 0.5 : 1,
            }}>{metricsLoading ? "ATUALIZANDO..." : "↻ ATUALIZAR"}</button>
          </div>

          {metricsLoading && (
            <div style={{ fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono'", letterSpacing: 1 }}>Carregando...</div>
          )}
          {!metricsLoading && metricsError && (
            <div style={{ padding: "16px", borderRadius: 12, background: `${C.red}10`, border: `1px solid ${C.red}33`, fontSize: 11, color: C.red, fontFamily: "'JetBrains Mono'", lineHeight: 1.6 }}>
              ⚠ {metricsError}
            </div>
          )}
          {!metricsLoading && !metricsError && campaigns.length === 0 && (
            <div style={{ padding: "32px", borderRadius: 12, background: "#10102A", border: "1px solid #1E1E44", textAlign: "center", fontSize: 11, color: C.textDim, fontFamily: "'JetBrains Mono'", lineHeight: 1.8 }}>
              Nenhuma campanha ativa encontrada.<br />Verifique as env vars META_ACCESS_TOKEN e META_AD_ACCOUNT_CA2.
            </div>
          )}

          {!metricsLoading && campaigns.map((campaign) => (
            <div key={campaign.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Header da campanha */}
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: `${C.purple}0D`, borderLeft: `3px solid ${C.purple}`,
                border: `1px solid ${C.purple}33`,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.purple, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {campaign.name}
                </div>
              </div>

              {campaign.adsets.map((adset) => (
                <div key={adset.id} style={{ paddingLeft: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Subtítulo do adset */}
                  <div style={{ fontSize: 11, color: C.textMid, fontFamily: "'JetBrains Mono'", letterSpacing: 1, paddingLeft: 4, borderLeft: `1px solid ${C.border}` }}>
                    ▸ {adset.name}
                  </div>

                  {/* Cards de anúncios */}
                  {adset.ads.map((ad) => {
                    const fields = [
                      { label: "GASTO",      value: ad.spend },
                      { label: "IMPRESSÕES", value: ad.impressions },
                      { label: "ALCANCE",    value: ad.reach },
                      { label: "CLIQUES",    value: ad.clicks },
                      { label: "CTR",        value: ad.ctr },
                      { label: "CPC",        value: ad.cpc },
                      { label: "CPM",        value: ad.cpm },
                      { label: "FREQUÊNCIA", value: ad.frequency },
                      { label: "LEADS",      value: ad.leads },
                      { label: "CONVERSÕES", value: ad.conversions },
                      { label: "CPL",        value: ad.cpl },
                    ];
                    return (
                      <div key={ad.ad_id} style={{ background: "#10102A", border: "1px solid #1E1E44", borderRadius: 12, padding: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#E8E8F0", fontFamily: "'Space Grotesk', sans-serif" }}>
                            {ad.ad_name}
                          </div>
                          <span style={{
                            fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
                            padding: "2px 8px", borderRadius: 6,
                            background: "rgba(0,229,160,0.12)", color: "#00E5A0",
                          }}>ACTIVE</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                          {fields.map(({ label, value }) => (
                            <div key={label} style={{ background: "#0A0A1A", borderRadius: 8, padding: "8px 10px" }}>
                              <div style={{ fontSize: 8, color: "#4A4A6A", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                                {label}
                              </div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: "#E8E8F0", fontFamily: "'Space Grotesk', sans-serif" }}>
                                {value != null ? String(value) : "—"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Base de conhecimento */}
      {tab === "base" && (
        <div style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono'", letterSpacing: 1 }}>
            O que você escrever aqui define o comportamento do agente.
          </div>
          <textarea
            value={kbLoading ? "" : kbText}
            onChange={e => setKbText(e.target.value)}
            placeholder={kbLoading ? "Carregando..." : "Insira aqui as regras e contexto do agente..."}
            disabled={kbLoading}
            style={{
              flex: 1, minHeight: 260, background: C.surface2, border: `1px solid ${C.purple}33`,
              borderRadius: 12, padding: "14px 16px", color: C.text, fontSize: 14,
              fontFamily: "'JetBrains Mono'", lineHeight: 1.7, resize: "vertical",
              outline: "none", caretColor: C.purple, opacity: kbLoading ? 0.5 : 1,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={saveKb}
              disabled={kbSaving || kbLoading}
              style={{
                padding: "9px 24px", borderRadius: 9, border: `1px solid ${C.purple}44`,
                background: `${C.purple}18`, color: C.purple, cursor: kbSaving ? "default" : "pointer",
                fontSize: 11, fontFamily: "'JetBrains Mono'", letterSpacing: 2,
                opacity: kbSaving ? 0.6 : 1,
              }}>{kbSaving ? "SALVANDO..." : "SALVAR"}</button>
            {toast && (
              <span style={{
                fontSize: 10, color: C.green, fontFamily: "'JetBrains Mono'",
                letterSpacing: 1, animation: "msgIn 0.2s ease",
              }}>✓ Salvo!</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────
export default function MundoInvertido() {
  const [view, setView] = useState("radar");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSelectProject = (projectId) => {
    setSelectedProject(PROJECTS.find(p => p.id === projectId));
    setView("project");
  };

  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent);
    setView("agent");
  };

  return (
    <div style={{ background: C.bg, width: "100%", height: "100vh", position: "relative", overflow: "hidden", fontFamily: "'Inter'" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes ringPulse { 0%{transform:translate(-50%,-50%) scale(.8);opacity:.2} 100%{transform:translate(-50%,-50%) scale(1.5);opacity:0} }
        @keyframes scanLine { 0%{transform:translateY(-100%)} 100%{transform:translateY(100%)} }
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes zoomIn { from{opacity:0;transform:scale(1.08)} to{opacity:1;transform:scale(1)} }
        * { box-sizing:border-box; margin:0; padding:0 }
        ::-webkit-scrollbar { width:3px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:3px }
        button:hover { filter:brightness(1.15) }
        input::placeholder { color:${C.textDim} }
      `}</style>

      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${C.purple}06 0%, transparent 60%)`,
        pointerEvents: "none",
      }} />

      {view === "radar" && (
        <header style={{
          position: "absolute", top: 0, left: 0, right: 0, padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          zIndex: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/valtix-logo.svg" alt="" height="26"
              style={{ filter: `drop-shadow(0 0 8px ${C.purpleGlow})` }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk'", letterSpacing: 2 }}>MUNDO INVERTIDO</div>
              <div style={{ fontSize: 8, color: C.textDim, fontFamily: "'JetBrains Mono'", letterSpacing: 3 }}>VALTIX ECOSYSTEM</div>
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, fontFamily: "'JetBrains Mono'", letterSpacing: 1 }}>
            {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </header>
      )}

      {view === "radar" && <Radar onSelectProject={handleSelectProject} />}
      {view === "project" && selectedProject && (
        <ProjectView project={selectedProject} onBack={() => setView("radar")} onSelectAgent={handleSelectAgent} />
      )}
      {view === "agent" && selectedAgent && selectedProject && (
        <AgentView agent={selectedAgent} project={selectedProject} onBack={() => setView("project")} />
      )}
    </div>
  );
}
