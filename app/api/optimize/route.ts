import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import fs from "fs/promises";
import { exec } from "child_process";
import util from "util";
import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";

const execPromise = util.promisify(exec);

// Inicializamos el cliente de Groq (La IA que procesa el código)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Inicializamos Supabase para leer el Oráculo
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Variable global para no recargar la IA local en cada petición
let extractor: any = null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { codigo_sucio } = body;

    if (!codigo_sucio) {
      return NextResponse.json({ error: "Falta el código sucio" }, { status: 400 });
    }

    // ====================================================================
    // 🧠 FASE 1: RAG (Búsqueda en el Oráculo FinOps)
    // ====================================================================
    console.log("\n🔍 Consultando Oráculo Vectorial...");
    
    // 1. Cargamos el traductor matemático (HuggingFace) si no está en memoria
    if (!extractor) {
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    
    // 2. Convertimos el código del usuario a un vector de 384 dimensiones
    const output = await extractor(codigo_sucio, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(output.data);

    // 3. Buscamos en Supabase las reglas que coincidan con este código
    const { data: documentos, error: dbError } = await supabase.rpc('buscar_oraculo', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1, // Umbral para atrapar coincidencias
      match_count: 2        // Traemos las 2 mejores reglas
    });

    let contextoOraculo = "Aplica tus mejores prácticas generales de optimización O(1).";
    
    if (documentos && documentos.length > 0) {
      console.log("✅ Reglas FinOps encontradas. Inyectando contexto...");
      contextoOraculo = documentos.map((doc: any) => `[FUENTE: ${doc.metadatos.fuente}] - ${doc.contenido}`).join("\n\n");
    } else {
      console.log("⚠️ No se encontró contexto exacto. Usando conocimiento general.");
    }

    // ====================================================================
    // 🤖 FASE 2: LLAMADA A LLAMA 3.3 (Con Contexto Inyectado)
    // ====================================================================
    const promptMaestro = `Rol: Arquitecto Cloud FinOps y QA Automation.
    Objetivo: Optimizar el código Python para O(1) en memoria (usando yield/generadores) SIN ROMPER EL CONTRATO DE INTERFAZ.
    
    📘 MANUAL DE INFRAESTRUCTURA (REGLAS ESTRICTAS APLICABLES A ESTE CASO):
    ${contextoOraculo}
    
    REGLAS DE ORO:
    1. Si la función original devuelve diccionarios, tu versión optimizada DEBE generar diccionarios.
    2. BREVEDAD: Código elegante y corto. Reporte de máximo 2 oraciones.
    3. SCRIPT DE PRUEBA INFALIBLE (¡ATENCIÓN ACÁ!): 
       El valor de "script_prueba" DEBE ser un código Python 100% independiente y auto-contenido. 
       DEBE incluir OBLIGATORIAMENTE en este orden:
       - El código exacto de la función original completo.
       - El código de tu nueva función optimizada completo.
       - Variables dummy simples.
       - El assert final: 'assert list(escanear_logs_nube(logs_crudos, ips_maliciosas, firmas_ataque)) == list(escanear_logs_nube_optimizado(logs_crudos, ips_maliciosas, firmas_ataque))'
       Si no incluyes las dos funciones (original y optimizada) adentro del script de prueba, Python dará NameError.
    4. MÉTRICAS FINOPS: Analiza tu optimización y calcula fríamente el impacto en la infraestructura.
       
    DEBES RESPONDER ÚNICAMENTE CON UN OBJETO JSON VÁLIDO con este formato exacto:
    {
      "codigo_optimizado": "tu codigo limpio aca",
      "reporte": "reporte muy corto aca",
      "script_prueba": "tu codigo python aca con el assert",
      "metricas": {
        "complejidad_espacial": "ej: O(1)",
        "porcentaje_ahorro_ram": 60,
        "metodo_usado": "ej: Expresión Generadora"
      }
    }
    No incluyas texto en formato markdown ni explicaciones fuera del JSON.`;
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: promptMaestro },
        { role: "user", content: `Optimiza este código sucio:\n\n${codigo_sucio}` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // Baja temperatura = Modo Auditor estricto
    });

    const respuestaTexto = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Limpiamos la respuesta por si la IA metió markdown de código (```json)
    const jsonLimpio = respuestaTexto.replace(/```json\n?|```/g, "").trim();
    
    const resultado = JSON.parse(jsonLimpio) as {
      codigo_optimizado?: string;
      reporte?: string;
      script_prueba?: string;
      metricas?: {
        complejidad_espacial: string;
        porcentaje_ahorro_ram: number;
        metodo_usado: string;
      };
    };

    // ====================================================================
    // 🛡️ FASE 3: EL ESCUDO (Auto-Testing en Python)
    // ====================================================================
    let testPaso = false;
    let testError = "";

    if (resultado.script_prueba) {
      console.log("\n=========================================");
      console.log("⚙️ EJECUTANDO PRUEBA EN PYTHON...");
      const nombreArchivo = `temp_test_${Date.now()}.py`;

      try {
        await fs.writeFile(nombreArchivo, resultado.script_prueba);
        const { stdout } = await execPromise(`python ${nombreArchivo}`);
        
        console.log("✅ RESULTADO DEL TEST (ÉXITO):", stdout);
        testPaso = true;
      } catch (error: any) {
        console.error("❌ EL TEST FALLÓ ROTUNDAMENTE:");
        console.error(error.stdout || error.message);
        testPaso = false;
        testError = error.stdout || error.message;
      } finally {
        await fs.unlink(nombreArchivo).catch(() => {});
        console.log("=========================================\n");
      }
    }

    // ====================================================================
    // 📦 FASE 4: DEVOLUCIÓN AL FRONTEND
    // ====================================================================
    return NextResponse.json({
      codigo_optimizado: resultado.codigo_optimizado || "",
      reporte: resultado.reporte || "",
      test_paso: testPaso,
      test_error: testError,
      metricas: resultado.metricas || null
    });

  } catch (error: any) {
    console.error("❌ Error en la API:", error);
    return NextResponse.json({ error: error.message || "Error procesando el código" }, { status: 500 });
  }
}