package com.siszoo.processos;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;
import com.siszoo.processos.repository.ResultadoProcessoRepository;
import com.siszoo.processos.service.NotificacaoResultadoService;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.service.AuditoriaEventoService;

import io.restassured.http.ContentType;

@Import(RelogioTesteConfig.class)
class ResultadoProcessoTransacaoIT extends AbstractIntegrationTest {

    private static final long ESPERA_NOTIFICACAO_MS = 1500;

    @MockitoSpyBean
    private AuditoriaEventoService auditoriaEventoService;

    @MockitoSpyBean
    private ResultadoProcessoRepository resultadoProcessoRepository;

    @MockitoBean
    private NotificacaoResultadoService notificacaoResultadoService;

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String token;

    @BeforeEach
    void criarToken() {
        token = fixture.tokenComCargo("agente.transacao.resultado@itu.sp.gov.br", "Agente", "TransacaoResultado",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
    }

    @Test
    @DisplayName("[T34] falha na auditoria depois do historico e do vigente: 500, nada gravado, nada notificado")
    void falhaNaAuditoriaDesfazHistoricoEVigente() {
        String processoId = processoAguardandoResultado();
        int eventosAntes = eventosDeAtualizacao(processoId);
        doThrow(new IllegalStateException("falha simulada na auditoria")).when(auditoriaEventoService)
                .registrar(any(), eq(AcaoAuditoria.ATUALIZACAO), eq("processo_sanitario"), any(), any(), any());

        lancarPositivo(processoId).then().statusCode(500);
        verify(auditoriaEventoService, times(2))
                .registrar(any(), eq(AcaoAuditoria.ATUALIZACAO), eq("processo_sanitario"), any(), any(), any());

        assertNadaGravado(processoId, eventosAntes);
        verify(notificacaoResultadoService, after(ESPERA_NOTIFICACAO_MS).never()).notificarResultado(any(UUID.class));
    }

    @Test
    @DisplayName("[T34] falha depois do publishEvent (resposta): 500, nada gravado e a notificacao NAO sai (AFTER_COMMIT)")
    void falhaDepoisDoEventoNaoNotifica() {
        String processoId = processoAguardandoResultado();
        int eventosAntes = eventosDeAtualizacao(processoId);
        doThrow(new IllegalStateException("falha simulada na resposta")).when(resultadoProcessoRepository)
                .findByProcessoId(UUID.fromString(processoId));

        lancarPositivo(processoId).then().statusCode(500);
        verify(auditoriaEventoService, times(2))
                .registrar(any(), eq(AcaoAuditoria.ATUALIZACAO), eq("processo_sanitario"), any(), any(), any());

        assertNadaGravado(processoId, eventosAntes);
        verify(notificacaoResultadoService, after(ESPERA_NOTIFICACAO_MS).never()).notificarResultado(any(UUID.class));
    }

    private String processoAguardandoResultado() {
        String processoId = fixture.postarProcesso(token, null, false).then().statusCode(200).extract().path("id");
        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("status", "AGUARDANDO_RESULTADO"))
                .when().patch("/api/processos/" + processoId + "/status").then().statusCode(200);
        return processoId;
    }

    private io.restassured.response.Response lancarPositivo(String processoId) {
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("resultado", "positivo", "dataResultado", fixture.hoje().toString()))
                .when().post("/api/processos/" + processoId + "/resultados");
    }

    private void assertNadaGravado(String processoId, int eventosAntes) {
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM resultado_processo WHERE processo_id = CAST(? AS uuid)",
                Integer.class, processoId), equalTo(0));
        Map<String, Object> processo = jdbcTemplate.queryForMap("SELECT status_processo, resultado_laboratorial_id,"
                + " data_resultado, data_notificacao_municipe FROM processo_sanitario WHERE id = CAST(? AS uuid)",
                processoId);
        assertThat(processo.get("status_processo"), equalTo("AGUARDANDO_RESULTADO"));
        assertThat(processo.get("resultado_laboratorial_id"), nullValue());
        assertThat(processo.get("data_resultado"), nullValue());
        assertThat(processo.get("data_notificacao_municipe"), nullValue());
        assertThat(eventosDeAtualizacao(processoId), equalTo(eventosAntes));
    }

    private int eventosDeAtualizacao(String processoId) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM auditoria_evento WHERE entidade = 'processo_sanitario'"
                + " AND acao = 'ATUALIZACAO' AND entidade_id = CAST(? AS uuid)", Integer.class, processoId);
    }
}
