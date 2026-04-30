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

    const promptMaestro = `Rol: Arquitecto Cloud FinOps de Élite.
    Objetivo: Optimizar código Python reduciendo O(n) en memoria y O(n^2) en CPU, SIN romper la lógica.
    
    REGLAS DE ORO:
    1. PROHIBIDO: NUNCA iteres un generador o lista múltiples veces dentro de un bucle for.
    2. OBLIGATORIO (CPU): Si hay bucles anidados buscando datos, DEBES crear primero un Diccionario (Hash Map) agrupando los datos, y luego usar ese diccionario.
    3. FORMATO (ESTRICTO): El campo "reporte" DEBE ser una lista con guiones ('- '). PROHIBIDO usar párrafos.

    EJEMPLO DE CÓDIGO ESPERADO (CÓPIALO COMO MODELO):
    def calcular_totales():
        # 1. Agrupar primero (O(n))
        totales_dict = {}
        for t in obtener_transacciones():
            totales_dict[t['user_id']] = totales_dict.get(t['user_id'], 0) + t['monto']
            
        # 2. Generar reporte rápido (O(1))
        return ( {'Usuario': u['nombre'], 'Total': totales_dict.get(u['id'], 0)} 
                 for u in obtener_usuarios() if totales_dict.get(u['id'], 0) > 0 )
        
    DEBES RESPONDER ÚNICAMENTE CON UN OBJETO JSON VÁLIDO:
    {
      "codigo_optimizado": "tu codigo aca",
      "reporte": "- Se eliminó bucle O(n^2) usando un Hash Map.\\n- Se redujo el uso de memoria.",
      "script_prueba": "print('test')",
      "metricas": {
        "complejidad_espacial": "O(n)",
        "porcentaje_ahorro_ram": 85,
        "metodo_usado": "Hash Map"
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