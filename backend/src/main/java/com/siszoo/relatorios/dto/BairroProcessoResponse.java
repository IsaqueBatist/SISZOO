package com.siszoo.relatorios.dto;

public record BairroProcessoResponse(String bairro, long processos, long positivos, String doencasPredominantes) {
}
