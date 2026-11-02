package com.siszoo.relatorios.dto;

import java.time.LocalDate;
import java.util.List;

// Versao simplificada do protótipo (docs/prototipo/relatorio-adocoes.html):
// nao ha tabela `adocao` no schema hoje (DER §3.2, modelo-alvo ainda nao
// implementado) - sem data de adoção, dados do adotante nem conceito de
// devolução. "Adoções realizadas", "tempo médio", "devoluções", "em
// processo" e "últimas adoções" do protótipo ficam de fora; o que resta é
// a posição, na data da geração (periodoInicio = periodoFim), de quantos animais
// estão com status=adotado e seu perfil por espécie/porte. `notaLimitacao`
// explica isso no próprio relatório.
public record RelatorioAdocoesResponse(
        LocalDate periodoInicio,
        LocalDate periodoFim,
        KpisAdocoesResponse kpis,
        List<PerfilAdocaoResponse> perfil,
        String notaLimitacao) {
}
