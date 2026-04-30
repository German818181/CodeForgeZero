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
    Objetivo: Optimizar código Python reduciendo O(n) en memoria y O(n^2) en CPU, SIN romper la lógica de negocio.
    
    REGLAS DE ORO (ESTRICTAS):
    1. AHORRO DE RAM: Usa generadores (yield) para listas simples, PERO NUNCA iteres un generador más de una vez.
    2. PROTECCIÓN DE CPU Y LÓGICA (OBLIGATORIO): Si detectas bucles anidados buscando datos (O(n^2)), TIENES PROHIBIDO usar generadores agotables en el segundo bucle. DEBES agrupar los datos primero usando un Diccionario (Hash Map) en memoria para que la búsqueda sea O(1).
    3. DESTRUCCIÓN DE LATENCIA (I/O BOUND): Transforma peticiones de red sincrónicas iteradas en concurrencia asincrónica usando 'asyncio'.
    4. EXCEPCIÓN DE INTERFAZ: Puedes usar 'asyncio.run()' internamente si necesitas asincronismo sin cambiar el 'def' principal.
    5. FORMATO DEL REPORTE: El campo "reporte" DEBE ser una lista estructurada. Usa '\\n- ' para cada punto. PROHIBIDO usar párrafos.
        
    DEBES RESPONDER ÚNICAMENTE CON UN OBJETO JSON VÁLIDO:
    {
      "codigo_optimizado": "tu codigo limpio aca",
      "reporte": "- Eliminé bucle O(n^2) usando Hash Map.\\n- Reduje RAM con generadores.",
      "script_prueba": "print('test')",
      "metricas": {
        "complejidad_espacial": "O(n)",
        "porcentaje_ahorro_ram": 80,
        "metodo_usado": "Hash Map y Generadores"
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

    // Adaptamos la respuesta para que tu frontend actual la lea correctamente
    return NextResponse.json({
      datos_optimizados: {
        codigo_optimizado: resultado.codigo_optimizado || "",
        reporte: resultado.reporte || "",
        metricas: resultado.metricas || null
      }
    });

  } catch (error: any) {
    console.error("❌ Error en la API:", error);
    return NextResponse.json({ error: error.message || "Error procesando el código" }, { status: 500 });
  }
}