package com.siszoo.ocorrencias;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.http.ContentType;

// T26: detalhe e download deixaram de ser readOnly para gravar a VISUALIZACAO.
// Este teste trava o efeito colateral: as leituras emitem exatamente o INSERT
// da auditoria (em sigilosa) e nenhum UPDATE — um dirty-check acidental numa
// entidade carregada apareceria aqui. Mesmo inspector (e mesmo contexto em
// cache) de AnexoOcorrenciaQueriesIT.
@Import(RelogioTesteConfig.class)
@TestPropertySource(properties =
        "spring.jpa.properties.hibernate.session_factory.statement_inspector=com.siszoo.ocorrencias.SqlCapturado")
class AuditoriaSigiloSqlIT extends AbstractIntegrationTest {

    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01};

    @Autowired
    private ApiTesteFixture fixture;

    @Test
    @DisplayName("[T26] GET do detalhe e download de sigilosa: exatamente 1 INSERT (em auditoria_evento) e 0 UPDATE")
    void sigilosaEmiteSoOInsertDaAuditoria() {
        String token = fixture.tokenAdmin("admin.sigilo.sql@itu.sp.gov.br", "SigiloSql");
        String id = criarOcorrencia(token, true);
        String anexoId = anexar(token, id);

        SqlCapturado.limpar();
        given().header("Authorization", "Bearer " + token).when().get("/api/ocorrencias/" + id).then().statusCode(200);
        verificarSoInsertDaAuditoria();

        SqlCapturado.limpar();
        given().header("Authorization", "Bearer " + token).when().get("/api/ocorrencias/" + id + "/anexos/" + anexoId)
                .then().statusCode(200);
        verificarSoInsertDaAuditoria();
    }

    @Test
    @DisplayName("[T26] GET do detalhe e download de nao sigilosa: nenhum INSERT nem UPDATE")
    void naoSigilosaNaoEscreve() {
        String token = fixture.tokenAdmin("admin.sigilo.sql@itu.sp.gov.br", "SigiloSql");
        String id = criarOcorrencia(token, false);
        String anexoId = anexar(token, id);

        SqlCapturado.limpar();
        given().header("Authorization", "Bearer " + token).when().get("/api/ocorrencias/" + id).then().statusCode(200);
        given().header("Authorization", "Bearer " + token).when().get("/api/ocorrencias/" + id + "/anexos/" + anexoId)
                .then().statusCode(200);

        assertThat(comandos("insert"), empty());
        assertThat(comandos("update"), empty());
    }

    private void verificarSoInsertDaAuditoria() {
        List<String> inserts = comandos("insert");
        assertThat(inserts, hasSize(1));
        assertThat(inserts.get(0), startsWith("insert into auditoria_evento"));
        assertThat(comandos("update"), empty());
    }

    private static List<String> comandos(String verbo) {
        return SqlCapturado.comandos().stream()
                .map(sql -> sql.trim().toLowerCase(Locale.ROOT))
                .filter(sql -> sql.startsWith(verbo + " "))
                .toList();
    }

    private String criarOcorrencia(String token, boolean sigilosa) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "zoonose");
        corpo.put("dataAbertura", RelogioTesteConfig.HOJE.toString());
        corpo.put("endereco", "Rua Teste, 1");
        corpo.put("bairro", "Centro");
        corpo.put("descricao", "Ocorrencia do teste de SQL da T26");
        corpo.put("sigilosa", sigilosa);
        corpo.put("denunciante", Map.of("nome", "Denunciante Sql"));
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON).body(corpo)
                .when().post("/api/ocorrencias").then().statusCode(200).extract().path("id");
    }

    private String anexar(String token, String id) {
        return given().header("Authorization", "Bearer " + token).multiPart("arquivo", "foto.png", PNG, "image/png")
                .when().post("/api/ocorrencias/" + id + "/anexos").then().statusCode(200).extract().path("id");
    }
}
