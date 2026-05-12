// End point para as requisiçoes ao Backend
// Permite configurar via arquivo public/config.runtime.js
const runtimeConfig = window.__APP_CONFIG__ || {};
const apiBase = (runtimeConfig.apiBase || "").trim();

export const http = apiBase !== "" ? apiBase : window.location.origin;
