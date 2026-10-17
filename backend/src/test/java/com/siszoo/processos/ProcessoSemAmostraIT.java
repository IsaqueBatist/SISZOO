package com.siszoo.processos;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;
import com.siszoo.processos.entity.AnimalAmostrado;
import com.siszoo.processos.repository.AnimalAmostradoRepository;

import io.restassured.response.Response;

// Ultima barreira da regra "processo tem >= 1 amostra" (DH-2). O DTO e o
// service ja recusam um processo sem amostras; aqui o repositorio de amostras
// e trocado por um mock que nao grava nada, para o processo chegar ao banco
// sem amostra. A constraint trigger adiavel da V13 so dispararia no COMMIT,
// fora do service (onde a excecao viraria 500); o SET CONSTRAINTS ALL
// IMMEDIATE do service a antecipa, e a resposta e o 409 generico de
// integridade, com ErroResponse e sem nada gravado.
@Import(RelogioTesteConfig.class)
class ProcessoSemAmostraIT extends AbstractIntegrationTest {

    @MockitoBean
    private AnimalAmostradoRepository amostraRepository;

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("[DH-2] processo sem amostra que chega ao banco: 409 com ErroResponse, nada gravado, protocolo nao consumido")
    @SuppressWarnings("unchecked")
    void processoSemAmostraNoBancoResultaEm409() {
        String token = fixture.tokenComCargo("agente.sem.amostra@itu.sp.gov.br", "Agente", "SemAmostra",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        when(amostraRepository.saveAll(anyIterable()))
                .thenAnswer(chamada -> List.copyOf((List<AnimalAmostrado>) chamada.getArgument(0)));
        int processos = contar("processo_sanitario");
        int responsaveis = contar("responsavel_processo");
        Integer protocolo = jdbcTemplate.queryForObject(
                "SELECT coalesce(max(ultimo), 0) FROM protocolo_sequencia WHERE entidade = 'PROCESSO'", Integer.class);

        Response resposta = fixture.postarProcesso(token, null, false);

        resposta.then().statusCode(409);
        assertThat(resposta.path("mensagem"), equalTo("Operacao viola uma regra de integridade dos dados"));
        assertThat(resposta.asString(), not(containsString("ck_processo_sanitario_amostra")));
        assertThat(contar("processo_sanitario"), equalTo(processos));
        assertThat(contar("responsavel_processo"), equalTo(responsaveis));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT coalesce(max(ultimo), 0) FROM protocolo_sequencia WHERE entidade = 'PROCESSO'", Integer.class),
                equalTo(protocolo));
    }

    private int contar(String tabela) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + tabela, Integer.class);
    }
}
