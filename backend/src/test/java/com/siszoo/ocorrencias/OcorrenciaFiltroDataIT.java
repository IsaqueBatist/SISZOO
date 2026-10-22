package com.siszoo.ocorrencias;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// F2-010 / RF-E02 (Fase 3 do TG): filtro por periodo da data de abertura em
// GET /api/ocorrencias (docs/contratos/ocorrencias-filtro-data.md).
class OcorrenciaFiltroDataIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    private String tokenAgente;
    private String antiga;
    private String recente;

    @BeforeEach
    void preparar() {
        tokenAgente = fixture.tokenComCargo("agente.filtro.data@itu.sp.gov.br", "Agente", "FiltroData",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        antiga = criar(fixture.hoje().minusDays(40), "Rua Antiga, 10", "Bairro Antigo");
        recente = criar(fixture.hoje().minusDays(2), "Rua Recente, 20", "Bairro Recente");
    }

    @Test
    @DisplayName("[F2-010] de/ate filtram pela data de abertura (dias inclusivos); sem parametros devolve todas")
    void filtraPorPeriodo() {
        String hoje = fixture.hoje().toString();
        Response ultimos7 = listar("?de=" + fixture.hoje().minusDays(7) + "&ate=" + hoje + "&tamanho=100");
        ultimos7.then().statusCode(200);
        List<String> ids = ultimos7.path("itens.id");
        assertThat(ids, hasItem(recente));
        assertThat(ids, not(hasItem(antiga)));

        Response soAntigas = listar("?ate=" + fixture.hoje().minusDays(30) + "&tamanho=100");
        List<String> idsAntigas = soAntigas.path("itens.id");
        assertThat(idsAntigas, hasItem(antiga));
        assertThat(idsAntigas, not(hasItem(recente)));

        // Limite inclusivo: "de" igual a propria data de abertura inclui o registro.
        Response inclusivo = listar("?de=" + fixture.hoje().minusDays(40) + "&ate=" + fixture.hoje().minusDays(40) + "&tamanho=100");
        List<String> idsInclusivo = inclusivo.path("itens.id");
        assertThat(idsInclusivo, hasItem(antiga));

        Response todas = listar("?tamanho=100");
        List<String> idsTodas = todas.path("itens.id");
        assertThat(idsTodas, hasItem(antiga));
        assertThat(idsTodas, hasItem(recente));
    }

    @Test
    @DisplayName("[F2-010] periodo combina com os demais filtros (tipo e busca por bairro)")
    void combinaComOutrosFiltros() {
        Response r = listar("?de=" + fixture.hoje().minusDays(7) + "&tipo=irregular&q=Recente&tamanho=100");
        r.then().statusCode(200);
        // Cada metodo de teste cria o proprio par de ocorrencias no mesmo banco: a
        // recente deste teste entra e a antiga fica de fora.
        List<String> ids = r.path("itens.id");
        assertThat(ids, hasItem(recente));
        assertThat(ids, not(hasItem(antiga)));
    }

    private Response listar(String query) {
        return given().header("Authorization", "Bearer " + tokenAgente).when().get("/api/ocorrencias" + query);
    }

    private String criar(LocalDate dataAbertura, String endereco, String bairro) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "irregular");
        corpo.put("dataAbertura", dataAbertura.toString());
        corpo.put("horaAbertura", "09:00");
        corpo.put("endereco", endereco);
        corpo.put("bairro", bairro);
        corpo.put("descricao", "Ocorrencia de teste para o filtro de periodo");
        corpo.put("urgente", false);
        corpo.put("sigilosa", false);
        corpo.put("anonima", true);
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAgente)
                .body(corpo).when().post("/api/ocorrencias").then().statusCode(200).extract().path("id");
    }
}
