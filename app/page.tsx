"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

type OutputPanelProps = {
  code: string;
  isOptimizing: boolean;
};

type ImpactPanelProps = {
  visible: boolean;
  report: string;
  metricas: {
    complejidad_espacial: string;
    porcentaje_ahorro_ram: number;
    metodo_usado: string;
  } | null;
};

type OptimizeButtonProps = {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
};

function Navbar() {
  return (
    <header className="border-b border-border bg-black">
      <div className="container mx-auto px-4 py-4 max-w-7xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="CodeForgeZero Logo" width={40} height={40} className="w-10 h-10 object-contain" />
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            CodeForge<span className="text-primary">Zero</span>
          </h2>
        </div>
        <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded border border-primary/30">
          BETA B2B
        </span>
      </div>
    </header>
  );
}

function CodeEditor({ value, onChange }: CodeEditorProps) {
  return (
    <div className="h-full rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex justify-between items-center">
        <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          🐍 Python <span className="text-xs font-normal opacity-70">(Optimizador FinOps)</span>
        </span>
      </div>
      <textarea
        className="h-[420px] w-full rounded border border-border bg-background/50 p-4 font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
        placeholder="Pegá tu script ineficiente de procesamiento de datos o IA aquí..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function OptimizeButton({ onClick, isLoading, disabled }: OptimizeButtonProps) {
  return (
    <button
      type="button"
      className="group relative rounded-md bg-primary px-6 py-3 font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40"
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <span className="flex items-center gap-2 animate-pulse">
          ⚙️ Auditando RAM...
        </span>
      ) : (
        "Optimizar Código ⚡"
      )}
    </button>
  );
}

function OutputPanel({ code, isOptimizing }: OutputPanelProps) {
  return (
    <div className="h-full rounded-lg border border-border bg-card p-4 shadow-sm relative overflow-hidden">
      <div className="mb-3 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-muted-foreground">Código O(1) de Bajo Consumo</h3>
      </div>
      <pre className="h-[420px] overflow-auto rounded border border-border bg-background/50 p-4 text-sm font-mono text-green-400">
        <code>{isOptimizing ? "Reescribiendo lógica heurística..." : code || "Esperando input..."}</code>
      </pre>
    </div>
  );
}

function ImpactPanel({ visible, report, metricas }: ImpactPanelProps) {
  if (!visible) return null;

  const reportCards = report
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-6 shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📉</span>
        <h3 className="font-bold text-xl text-foreground">Proyección de Ahorro Cloud (FinOps Real-Time)</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-md border border-green-500/30 bg-green-900/10 p-4 text-center hover:border-green-500 transition-colors">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Complejidad Espacial</p>
          <p className="text-2xl font-bold text-green-400">
            {metricas?.complejidad_espacial ?? "Analizando..."}
          </p>
          <p className="text-xs text-green-500/70 mt-1">Carga en Streaming</p>
        </div>
        <div className="rounded-md border border-blue-500/30 bg-blue-900/10 p-4 text-center hover:border-blue-500 transition-colors">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reducción de RAM Est.</p>
          <p className="text-2xl font-bold text-blue-400">
            ~{metricas?.porcentaje_ahorro_ram ?? 0}%
          </p>
          <p className="text-xs text-blue-500/70 mt-1">Menos picos de memoria</p>
        </div>
        <div className="rounded-md border border-purple-500/30 bg-purple-900/10 p-4 text-center hover:border-purple-500 transition-colors">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Método de Optimización</p>
          <p className="text-lg font-bold text-purple-400 mt-1 leading-tight">
            {metricas?.metodo_usado ?? "Refactoring Heurístico"}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Reporte del Arquitecto IA:</h4>
        <div className="space-y-2">
          {reportCards.map((item, index) => (
            <p key={index} className="text-sm text-foreground/80 flex gap-2">
              <span className="text-primary">▸</span> {item}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [inputCode, setInputCode] = useState("");
  const [outputCode, setOutputCode] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [report, setReport] = useState("");
  const [metricas, setMetricas] = useState<{
    complejidad_espacial: string;
    porcentaje_ahorro_ram: number;
    metodo_usado: string;
  } | null>(null);

  const [emailWaitlist, setEmailWaitlist] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleOptimize = async () => {
    if (!inputCode.trim()) return;

    setIsOptimizing(true);
    setShowImpact(false);
    setReport("");
    setOutputCode("");
    setMetricas(null);

    try {
      // 🔌 CONEXIÓN DIRECTA AL MOTOR PYTHON V2
      const response = await fetch("https://codeforgezero-backend.onrender.com/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo_sucio: inputCode }),
      });

      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error || "Error en el servidor Python");
      
      // Extraemos la magia desde la nueva estructura del backend
      const datosOptimizados = data.datos_optimizados;
      
      setOutputCode(datosOptimizados?.codigo_optimizado ?? "No se generó código.");
      setReport(datosOptimizados?.reporte ?? "Sin reporte.");
      
      if (datosOptimizados?.metricas) {
        setMetricas(datosOptimizados.metricas);
      }
      
      // Acá en consola vas a poder chusmear si sobrevivió al coliseo
      console.log("⚔️ Resultado del Coliseo:", data.resultado_ejecucion_real);
      
      setShowImpact(true);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al optimizar.";
      setOutputCode("Error de conexión con el motor V2.");
      setReport(message);
      setShowImpact(true);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailWaitlist) return;
    setWaitlistStatus("submitting");
    setTimeout(() => {
      setWaitlistStatus("success");
      setEmailWaitlist("");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground font-sans selection:bg-primary/30">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight text-balance">
            Escalá tu Infraestructura, <br/>
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">No tu Factura de AWS.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto text-pretty">
            CodeForgeZero audita y refactoriza scripts de Python en segundos. 
            Transformamos código ineficiente en funciones O(1) de bajo consumo para que tu equipo de Data e IA deje de desperdiciar RAM.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-8 items-stretch">
          <div className="min-h-[500px] w-full">
            <CodeEditor value={inputCode} onChange={setInputCode} />
          </div>

          <div className="flex lg:flex-col items-center justify-center py-4 lg:py-0 z-10">
            <OptimizeButton onClick={handleOptimize} isLoading={isOptimizing} disabled={!inputCode.trim()} />
          </div>

          <div className="min-h-[500px] w-full">
            <OutputPanel code={outputCode} isOptimizing={isOptimizing} />
          </div>
        </div>

        <ImpactPanel visible={showImpact} report={report} metricas={metricas} />

        <div className="mt-20 mb-10 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent p-8 md:p-12 text-center shadow-2xl shadow-primary/5">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Automatizá el Ahorro en tu CI/CD</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Estamos construyendo la integración oficial para GitHub Actions y GitLab CI. 
            Asegurate de que ningún código ineficiente llegue a producción.
          </p>
          
          <form onSubmit={handleWaitlist} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              required
              placeholder="tu@empresa.com" 
              value={emailWaitlist}
              onChange={(e) => setEmailWaitlist(e.target.value)}
              disabled={waitlistStatus === "success"}
              className="flex-1 rounded-md border border-border bg-black/50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={waitlistStatus !== "idle"}
              className="rounded-md bg-white text-black font-bold px-6 py-3 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {waitlistStatus === "idle" && "Unirme a la Beta"}
              {waitlistStatus === "submitting" && "Procesando..."}
              {waitlistStatus === "success" && "¡Anotado! ✅"}
            </button>
          </form>
          {waitlistStatus === "success" && (
            <p className="text-green-400 text-sm mt-3 animate-fade-in">¡Gracias! Te avisaremos cuando lancemos el plugin corporativo.</p>
          )}
        </div>

      </main>
    </div>
  );
}