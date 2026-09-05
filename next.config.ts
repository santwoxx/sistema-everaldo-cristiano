import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ha um package-lock.json no diretorio do usuario; fixamos a raiz aqui
  // para o Next rastrear os arquivos deste projeto, e nao a pasta pai.
  outputFileTracingRoot: __dirname,
  experimental: {
    // Assinaturas digitais e fotos chegam como data-URL nas Server Actions.
    serverActions: { bodySizeLimit: "8mb" },
  },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
