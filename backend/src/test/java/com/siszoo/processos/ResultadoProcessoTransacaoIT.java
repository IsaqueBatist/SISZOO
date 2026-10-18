package com.siszoo.processos;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.service.AuditoriaEventoService;

import io.restassured.http.ContentType;

// Rollback tardio do registro de resultado (T34): a auditoria e o ultimo
// passo, depois do INSERT em resultado_processo e do UPDATE do vigente em
// processo_sanitario. Com o service de auditoria trocado por um spy que falha
// so nesse passo, a transacao inteira tem de ser desfeita. Classe propria
// (como ProcessoSemAmostraIT): o spy muda a chave do contexto Spring.
@Import(RelogioTesteConfig.class)
class ResultadoProcessoTransacaoIT extends AbstractIntegrationTest {

    @MockitoSpyBean
    private AuditoriaEventoService auditoriaEventoService;

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("[T34] falha na auditoria depois do historico e do vigente: 500 e nada gravado")
    void falhaNaAuditoriaDesfazHistoricoEVigente() {
        String token = fixture.tokenComCargo("agente.transacao.resultado@itu.sp.gov.br", "Agente", "TransacaoResultado",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        String processoId = fixture.postarProcesso(token, null, false).then().statusCode(200).extract().path("id");
        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("status", "AGUARDANDO_RESULTADO"))
                .when().patch("/api/processos/" + processoId + "/status").then().statusCode(200);
        int eventosAntes = eventosDeAtualizacao(processoId);
        // So a partir daqui: criacao e avanco acima auditam normalmente.
        doThrow(new IllegalStateException("falha simulada na auditoria")).when(auditoriaEventoService)
                .registrar(any(), eq(AcaoAuditoria.ATUALIZACAO), eq("processo_sanitario"), any(), any(), any());

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("resultado", "positivo", "dataResultado", fixture.hoje().toString()))
                .when().post("/api/processos/" + processoId + "/resultados").then().statusCode(500);
        // A falha veio do ultimo passo (PATCH acima + POST), depois do INSERT
        // e do UPDATE, ambos com flush no service.
        verify(auditoriaEventoService, times(2))
                .registrar(any(), eq(AcaoAuditoria.ATUALIZACAO), eq("processo_sanitario"), any(), any(), any());

        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM resultado_processo WHERE processo_id = CAST(? AS uuid)",
                Integer.class, processoId), equalTo(0));
        Map<String, Object> processo = jdbcTemplate.queryForMap("SELECT status_processo, resultado_laboratorial_id,"
                + " data_resultado FROM processo_sanitario WHERE id = CAST(? AS uuid)", processoId);
        assertThat(processo.get("status_processo"), equalTo("AGUARDANDO_RESULTADO"));
        assertThat(processo.get("resultado_laboratorial_id"), nullValue());
        assertThat(processo.get("data_resultado"), nullValue());
        assertThat(eventosDeAtualizacao(processoId), equalTo(eventosAntes));
    }

    private int eventosDeAtualizacao(String processoId) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM auditoria_evento WHERE entidade = 'processo_sanitario'"
                + " AND acao = 'ATUALIZACAO' AND entidade_id = CAST(? AS uuid)", Integer.class, processoId);
    }
}
