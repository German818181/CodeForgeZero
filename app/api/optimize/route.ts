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
    Objetivo: Optimizar el código Python para O(1) en memoria (usando yield/generadores) y O(1) en tiempo I/O (usando asincronismo) SIN ROMPER EL CONTRATO DE INTERFAZ.
    
    REGLAS DE ORO:
    1. AHORRO DE RAM: Si la función original devuelve listas, tu versión optimizada DEBE usar generadores (yield) para ahorrar RAM.
    2. DESTRUCCIÓN DE LATENCIA (I/O BOUND): Si detectas operaciones sincrónicas de red (ej: requests.get) iterando en bucles o comprensiones, es OBLIGATORIO transformarlas a concurrencia asincrónica usando 'asyncio' y 'aiohttp' (ej: asyncio.gather). NUNCA dejes peticiones bloqueantes secuenciales.
    3. RESPETO DE INTERFAZ ESTRICTO: NO puedes cambiar la firma original de 'def' a 'async def'. Para lograr la concurrencia I/O sin romper el contrato externo, DEBES definir la lógica asincrónica internamente y ejecutarla utilizando 'asyncio.run()'.
    4. BREVEDAD: Código elegante y corto. Reporte de máximo 2 oraciones.
    5. ESCAPE DE CARACTERES: Es vital que escapes correctamente las comillas dobles y los saltos de línea (\\n) dentro de los valores del JSON. No uses saltos de línea literales.
    6. FORMATO DEL REPORTE (ESTRICTO): El valor del campo "reporte" DEBE ser una lista estructurada. Usa un salto de línea (\n) y un guión (-) para cada mejora. NUNCA escribas un solo párrafo.    
    7. NUEVA REGLA DE CPU Y AGRUPACIÓN: Si detectas bucles anidados $O(n^2)$ buscando relaciones entre dos conjuntos de datos, ESTÁ PROHIBIDO iterar múltiples veces. DEBES crear primero un Diccionario (Hash Map) en memoria para agrupar los datos (ej: totales por usuario) en $O(n)$, y luego generar la respuesta en $O(1)$. NUNCA iteres un generador más de una vez.
    DEBES RESPONDER ÚNICAMENTE CON UN OBJETO JSON VÁLIDO con este formato exacto:
    {
      "codigo_optimizado": "tu codigo limpio aca",
      "reporte": "reporte muy corto aca",
      "script_prueba": "print('test')",
      "metricas": {
        "complejidad_espacial": "O(1)",
        "porcentaje_ahorro_ram": 99,
        "metodo_usado": "Generadores y Asyncio"
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