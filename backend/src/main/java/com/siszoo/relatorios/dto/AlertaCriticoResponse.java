package com.siszoo.relatorios.dto;

// Espelha o "alerta (lógico)" do DER §3.7 — computado sob demanda, nunca
// persistido. `tipo` usa os códigos do enum tipo_alerta do DER; `severidade`
// é um de info/atencao/critico.
public record AlertaCriticoResponse(String tipo, String severidade, String titulo, String descricao, long total) {
}
