package com.siszoo.ocorrencias.dto;

// GET /api/ocorrencias/estatisticas/bairro (T45): so bairro e contagem, nada
// do denunciante nem da ocorrencia em si.
public record QuantidadePorBairroResponse(String bairro, long quantidade) {
}
