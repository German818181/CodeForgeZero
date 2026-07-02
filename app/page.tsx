"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function Navbar() {
  return (
    <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="CodeForgeZero Logo" width={40} height={40} className="w-10 h-10 object-contain shadow-cyan-500/20 shadow-lg" />
          <h2 className="text-xl font-bold text-white tracking-tighter">
            CodeForge<span className="text-cyan-400">Zero</span>
          </h2>
        </div>
        <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30 tracking-widest uppercase">
          Neural_Core_v5
        </span>
      </div>
    </header>
  );
}

function TerminalWindow({ title, children, color = "cyan" }: { title: string, children: React.ReactNode, color?: "cyan" | "green" }) {
  const glowColor = color === "cyan" ? "from-cyan-500 to-blue-600" : "from-green-500 to-emerald-600";

  return (
    <div className="relative group h-full">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${glowColor} rounded-lg blur opacity-10 group-hover:opacity-30 transition duration-1000`}></div>
      <div className="relative h-full bg-[#020617] ring-1 ring-white/10 rounded-lg flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"></div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">{title}</span>
        </div>
        <div className="flex-1 p-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [inputCode, setInputCode] = useState("");
  const [outputCode, setOutputCode] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const MENSAJES_CARGA = [
    ">> ESCANEANDO_ESTRUCTURA...",
    ">> DETECTANDO_INEFICIENCIAS...",
    ">> APLICANDO_REFACTOR...",
    ">> VALIDANDO_EN_SANDBOX...",
    ">> MIDIENDO_RENDIMIENTO...",
    ">> PROMEDIANDO_RESULTADOS...",
    ">> CASI_LISTO...",
  ];

  useEffect(() => {
    if (!isOptimizing) {
      setLoadingMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % MENSAJES_CARGA.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isOptimizing]);
  const [showImpact, setShowImpact] = useState(false);
  const [report, setReport] = useState("");
  const [metricas, setMetricas] = useState<{
    complejidad_espacial?: string;
    porcentaje_ahorro_ram: number | null;
    porcentaje_ahorro_cpu: number | null;
    metodo_usado?: string;
    metricas_disponibles: boolean;
    mensaje_metricas: string | null;
  } | null>(null);

  const [emailWaitlist, setEmailWaitlist] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleOptimize = async () => {
    if (!inputCode.trim()) return;
    setIsOptimizing(true);
    setShowImpact(false);

    try {
      const urlBase = "https://codeforgezero-backend.onrender.com";

      const response = await fetch(`${urlBase}/api/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo_sucio: inputCode }),
      });

      const data = await response.json();

      if (data.status === "exito") {
        const resIA = data.datos_optimizados;

        setOutputCode(resIA.codigo_optimizado);
        setReport(resIA.reporte);

        if (resIA.metricas) {
          setMetricas({
            complejidad_espacial: resIA.metricas.complejidad_espacial,
            porcentaje_ahorro_ram: resIA.metricas.porcentaje_ahorro_ram ?? null,
            porcentaje_ahorro_cpu: resIA.metricas.porcentaje_ahorro_cpu ?? null,
            metodo_usado: resIA.metricas.metodo_usado,
            metricas_disponibles: resIA.metricas.metricas_disponibles ?? true,
            mensaje_metricas: resIA.metricas.mensaje_metricas ?? null,
          });
        }
        setShowImpact(true);
      } else if (data.status === "cargando") {
        setOutputCode(">> STATUS_RETRY: El modelo se está despertando...\n>> Intentá de nuevo en unos segundos.");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setOutputCode("# OFFLINE: No se pudo conectar con el motor.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailWaitlist) return;
    setWaitlistStatus("submitting");
    try {
      const { error } = await supabase.from('waitlist').insert([{ email: emailWaitlist }]);
      if (error) throw error;
      setWaitlistStatus("success");
      setEmailWaitlist("");
    } catch (error) {
      alert("Error al guardar mail.");
      setWaitlistStatus("idle");
    }
  };

  // Componente para tarjeta de métrica con soporte de N/A
  const MetricCard = ({
    label,
    value,
    disponible,
    accentColor = "green",
  }: {
    label: string;
    value: number | null;
    disponible: boolean;
    accentColor?: "green" | "cyan";
  }) => {
    const textColor = accentColor === "green" ? "text-green-400" : "text-cyan-400";

    if (!disponible || value === null) {
      return (
        <div className="border border-white/5 bg-white/[0.02] p-6 rounded-xl hover:bg-white/[0.04] transition-all flex flex-col justify-center relative overflow-hidden">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">{label}</p>
          <p className="text-3xl font-black italic text-slate-600">N/A</p>
          <p className="text-[9px] text-slate-600 font-mono mt-2 leading-tight">Librería externa no disponible en sandbox</p>
        </div>
      );
    }

    return (
      <div className="border border-white/5 bg-white/[0.02] p-6 rounded-xl hover:bg-white/[0.04] transition-all flex flex-col justify-center relative overflow-hidden">
        {accentColor === "green" && <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 blur-xl rounded-full"></div>}
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        <p className={`text-3xl font-black italic z-10 ${value >= 0 ? textColor : "text-red-500"}`}>
          {value >= 0 ? "+" : ""}{value}%
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-cyan-500/30 relative flex flex-col">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <Navbar />

      <main className="container mx-auto px-4 py-16 max-w-7xl relative z-10 flex-grow">

        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
            Forge <span className="text-cyan-400 not-italic">Zero</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-mono uppercase tracking-widest text-xs">
            Optimización FinOps // Auditoría de RAM // Arquitectura O(1)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-stretch mb-12">

          <div className="h-[500px]">
            <TerminalWindow title="Source_Input.py">
              <textarea
                id="codigo_salida"
                name="codigo_salida"
                spellCheck="false"
                className="w-full h-full bg-transparent text-cyan-400/90 p-4 font-mono text-sm focus:outline-none resize-none placeholder:text-slate-800"
                placeholder="# Pegá tu código ineficiente..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
              />
            </TerminalWindow>
          </div>

          <div className="flex lg:flex-col items-center justify-center">
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || !inputCode.trim()}
              className="group relative p-[1px] rounded-lg overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:animate-pulse"></div>
              <div className="relative px-8 py-4 bg-black rounded-[7px] transition-all group-hover:bg-transparent">
                <span className="text-white font-black tracking-tighter uppercase flex items-center gap-2">
                  {isOptimizing ? "AUDITING..." : "Execute_Refactor"}
                </span>
              </div>
            </button>
          </div>

          <div className="h-[500px]">
            <TerminalWindow title="Optimized_Output.py" color="green">
              <textarea
                readOnly
                spellCheck="false"
                className="w-full h-full bg-transparent text-green-400 p-4 font-mono text-sm focus:outline-none resize-none whitespace-pre"
                value={isOptimizing ? MENSAJES_CARGA[loadingMsgIndex] : outputCode || ">> WAITING_FOR_COMMAND"}
              />
            </TerminalWindow>
          </div>
        </div>

        {showImpact && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-[1px] bg-gradient-to-r from-white/5 via-white/20 to-white/5 rounded-2xl overflow-hidden">
              <div className="bg-[#020617] p-8 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Security Audit Report</h3>
                    <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">CodeForgeZero Intelligence Engine</p>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/50 px-6 py-2 rounded-full">
                    <span className="text-cyan-400 font-mono text-xs font-bold animate-pulse">SYSTEM_STABLE // 100%_SECURE</span>
                  </div>
                </div>

                {/* Aviso cuando las métricas no están disponibles */}
                {metricas?.metricas_disponibles === false && metricas.mensaje_metricas && (
                  <div className="mb-6 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-5 py-4">
                    <p className="text-[10px] font-mono text-yellow-500/70 uppercase tracking-widest mb-1">⚠ Sandbox_Warning</p>
                    <p className="text-xs font-mono text-slate-400 leading-relaxed">{metricas.mensaje_metricas}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  <div className="border border-white/5 bg-white/[0.02] p-6 rounded-xl hover:bg-white/[0.04] transition-all flex flex-col justify-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Space Complexity</p>
                    <p className="text-3xl font-black text-cyan-400 italic">{metricas?.complejidad_espacial ?? "O(1)"}</p>
                  </div>

                  <MetricCard
                    label="RAM Reduction"
                    value={metricas?.porcentaje_ahorro_ram ?? null}
                    disponible={metricas?.metricas_disponibles ?? true}
                    accentColor="cyan"
                  />

                  <MetricCard
                    label="CPU / Time"
                    value={metricas?.porcentaje_ahorro_cpu ?? null}
                    disponible={metricas?.metricas_disponibles ?? true}
                    accentColor="green"
                  />

                  <div className="border border-white/5 bg-white/[0.02] p-6 rounded-xl hover:bg-white/[0.04] transition-all flex flex-col justify-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Refactor Method</p>
                    <p className="text-sm font-bold text-white uppercase leading-tight">{metricas?.metodo_usado ?? "HEURISTIC"}</p>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 p-6 rounded-xl">
                  <p className="text-xs font-mono text-cyan-600 mb-4 uppercase tracking-[0.4em]">_Architect_Commentary</p>
                  <div className="space-y-3">
                    {(Array.isArray(report) ? report.join("\n") : String(report || "")).split("\n").map((line, i) => (
                      <p key={i} className="text-sm font-mono text-slate-400 flex gap-4">
                        <span className="text-cyan-500 opacity-50">[{i + 1}]</span> {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-32 text-center pb-16">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic underline decoration-cyan-500 decoration-4 underline-offset-8">Corporate_Deployment</h2>
            <p className="text-slate-500 text-sm font-mono leading-relaxed">
              Estamos integrando el motor de auditoría en pipelines de GitHub y GitLab. Unite a la lista de espera para el despliegue Enterprise.
            </p>
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-2">
              <input
                id="email_waitlist"
                name="email_waitlist"
                type="email"
                required
                placeholder="PRO_EMAIL@COMPANY.COM"
                value={emailWaitlist}
                onChange={(e) => setEmailWaitlist(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-6 py-4 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50 transition-all uppercase tracking-widest"
              />
              <button
                type="submit"
                disabled={waitlistStatus !== "idle"}
                className="bg-white text-black font-black uppercase tracking-tighter px-10 py-4 rounded-lg hover:bg-cyan-400 transition-all text-sm disabled:opacity-50"
              >
                {waitlistStatus === "idle" ? "Join_Waitlist" : waitlistStatus === "submitting" ? "Syncing..." : "Confirmed_v1"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
