package com.siszoo.animais.dto;

/**
 * Item do catalogo de vacinas dentro de {@code GET /api/animais/catalogos}.
 *
 * <p>Record proprio em vez de {@code CatalogoItemResponse}: o formulario de
 * vacinacao precisa PREVER a data do proximo reforco enquanto e preenchido, e
 * para isso precisa do {@code intervaloMeses}. Acrescentar o campo ao
 * {@code CatalogoItemResponse} o poluiria para especies, status de animal,
 * motivos de entrada, tipos de baia, tipos de exame e laboratorios, que nao
 * tem intervalo nenhum.
 *
 * <p>Mantem {@code codigo} e {@code nome} com os mesmos nomes do
 * {@code CatalogoItemResponse}, entao o {@code SelectCatalogoClinico} do
 * frontend continua recebendo esta lista sem mudanca (o tipo de TS e um
 * supertipo estrutural).
 *
 * <p>{@code intervaloMeses} nulo = vacina sem reforco definido, que nao gera
 * alerta (RN-A03). A data de validade de uma vacinacao JA gravada continua
 * vindo de {@code VacinacaoResponse.dataValidade}, fonte unica da RN-A01 —
 * nao recalcular a partir daqui.
 */
public record VacinaCatalogoResponse(String codigo, String nome, Integer intervaloMeses) {
}
