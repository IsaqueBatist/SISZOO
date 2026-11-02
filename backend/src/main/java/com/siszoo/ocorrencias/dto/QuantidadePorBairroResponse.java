package com.siszoo.ocorrencias.dto;

// GET /api/ocorrencias/estatisticas/bairro: so bairro e contagem, nada
// do denunciante nem da ocorrencia em si.
public record QuantidadePorBairroResponse(String bairro, long quantidade) {
}
