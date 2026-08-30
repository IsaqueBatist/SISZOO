// O backend real expõe todas as rotas sob o prefixo /api (ver SecurityConfig
// e os @RequestMapping dos controllers) — VITE_API_BASE_URL traz só host:porta.
export const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}/api`;
