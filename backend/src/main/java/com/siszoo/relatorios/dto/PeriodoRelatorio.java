package com.siszoo.relatorios.dto;

import java.time.LocalDate;

// Periodo sempre concreto (nunca "ano" ou "janela" em aberto) — e o que se
// grava em relatorio_gerado.periodo_inicio/periodo_fim (colunas NOT NULL,
// V20) e o que os services de agregacao de cada tipo recebem.
public record PeriodoRelatorio(LocalDate inicio, LocalDate fim) {
}
