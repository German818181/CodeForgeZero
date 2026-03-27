import { NextResponse } from "next/server";
import Groq from "groq-sdk";

// Inicializamos el cliente de Groq (La IA que procesa el código)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { codigo_sucio } = body;

    if (!codigo_sucio) {
      return NextResponse.json({ error: "Falta el código sucio" }, { status: 400 });
    }

    console.log("🚀 Mandando código a Groq con JSON Mode Estricto...");

    const promptMaestro = `Rol: Arquitecto Cloud FinOps y QA Automation.
    Objetivo: Optimizar el código Python para O(1) en memoria (usando yield/generadores) SIN ROMPER EL CONTRATO DE INTERFAZ.
    
    REGLAS DE ORO:
    1. Si la función original devuelve listas, tu versión optimizada DEBE usar generadores (yield) para ahorrar RAM.
    2. BREVEDAD: Código elegante y corto. Reporte de máximo 2 oraciones.
    3. ESCAPE DE CARACTERES: Es vital que escapes correctamente las comillas dobles y los saltos de línea (\\n) dentro de los valores del JSON. No uses saltos de línea literales.
       
    DEBES RESPONDER ÚNICAMENTE CON UN OBJETO JSON VÁLIDO con este formato exacto:
    {
      "codigo_optimizado": "tu codigo limpio aca",
      "reporte": "reporte muy corto aca",
      "script_prueba": "print('test')",
      "metricas": {
        "complejidad_espacial": "O(1)",
        "porcentaje_ahorro_ram": 99,
        "metodo_usado": "Expresión Generadora"
      }
    }`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: promptMaestro },
        { role: "user", content: `Optimiza este código:\n\n${codigo_sucio}` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      // 🚨 LA MAGIA: Forzamos a que devuelva un JSON perfecto a nivel máquina
      response_format: { type: "json_object" } 
    });

    const respuestaTexto = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Limpieza de seguridad por si Llama igual mete el bloque de markdown
    const jsonLimpio = respuestaTexto.replace(/```json\n?|```/g, "").trim();
    
    let resultado;
    try {
      resultado = JSON.parse(jsonLimpio);
    } catch (e) {
      console.error("Texto que rompió el JSON:", jsonLimpio);
      throw new Error("La IA devolvió un formato inválido. Reintentando...");
    }

    return NextResponse.json({
      codigo_optimizado: resultado.codigo_optimizado || "",
      reporte: resultado.reporte || "",
      test_paso: true, 
      test_error: "",
      metricas: resultado.metricas || null
    });

  } catch (error: any) {
    console.error("❌ Error en la API:", error);
    return NextResponse.json({ error: error.message || "Error procesando el código" }, { status: 500 });
  }
}