import type { NextConfig } from "next";

const nextConfig: NextConfig = {
// Le decimos a Vercel que no toque los motores nativos de IA
serverExternalPackages: ['onnxruntime-node', '@xenova/transformers'],
};

export default nextConfig;
