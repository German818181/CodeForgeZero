import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

// --- 🔑 TUS LLAVES (SIN TARJETAS) ---
const SUPABASE_URL = "https://moypcphlwpuahselngqw.supabase.co"; 
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1veXBjcGhsd3B1YWhzZWxuZ3F3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI5NTUzNiwiZXhwIjoyMDg5ODcxNTM2fQ.dSD0s2a4Sm1STkOXXccbd11Fv1ZGRD_mTOfVZp8yTMQ"; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const reglasFinOps = [
  {
    contenido: "Optimización de Memoria (O(1)): En Python, procesar grandes volúmenes de datos cargando todo en listas (list comprehensions) agota la RAM de los contenedores y encarece AWS Lambda. La regla de oro FinOps es usar Expresiones Generadoras (yield o paréntesis) para evaluar los elementos bajo demanda (Streaming), reduciendo el consumo espacial a O(1).",
    metadatos: { fuente: "AWS FinOps Guide", tema: "Complejidad Espacial" }
  },
  {
    contenido: "Búsquedas O(1) con Sets: Si necesitas verificar si un elemento existe dentro de una colección grande en Python, NUNCA uses una lista. Las listas tienen complejidad O(n). Convierte la lista a un Set (conjunto) usando set() para lograr búsquedas O(1) gracias al hashing subyacente, reduciendo drásticamente el uso de CPU.",
    metadatos: { fuente: "Python Advanced Docs", tema: "CPU y Búsquedas" }
  },
  {
    contenido: "Mutación de Diccionarios y Sets: Intentar usar diccionarios (dict) adentro de Sets (conjuntos) en Python arrojará un TypeError ('unhashable type: dict'). Los diccionarios son mutables y no pueden ser hasheados. La solución FinOps es extraer los valores necesarios a tuplas inmutables antes de insertarlos en el Set.",
    metadatos: { fuente: "Python Core Concepts", tema: "Seguridad de Tipos" }
  }
];

async function inyectarOraculo() {
  console.log("📥 Descargando modelo de IA local (solo la primera vez)...");
  
  // Instanciamos el modelo gratuito de HuggingFace (descarga unos 80MB la primera vez)
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  
  console.log("🧠 Iniciando inyección de conocimiento en el Oráculo...");

  for (const regla of reglasFinOps) {
    console.log(`\nTraduciendo a vectores: "${regla.metadatos.tema}"...`);
    
    // Convertimos el texto a 384 números localmente
    const output = await extractor(regla.contenido, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data);

    // Guardamos en Supabase
    const { error } = await supabase.from('oraculo_finops').insert({
      contenido: regla.contenido,
      metadatos: regla.metadatos,
      embedding: vector
    });

    if (error) {
      console.error("❌ Error guardando en Supabase:", error);
    } else {
      console.log("✅ Regla inyectada con éxito.");
    }
  }
  console.log("\n🎉 ¡Oráculo FinOps cargado gratis y listo para operar!");
}

inyectarOraculo();