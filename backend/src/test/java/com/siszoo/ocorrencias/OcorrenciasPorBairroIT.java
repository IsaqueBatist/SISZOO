package com.siszoo.ocorrencias;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.path.json.JsonPath;

// T45 (docs/contratos/distribuicao-ocorrencias-bairro.md): contagem por
// bairro agregada no banco, para o grafico e as sugestoes de bairro da tela de
// ocorrencias. So bairro e quantidade saem no corpo; ocorrencia sigilosa conta
// como as demais (a listagem ja mostra o bairro dela), sem dado de denunciante.
class OcorrenciasPorBairroIT extends AbstractIntegrationTest {

    private static final String ROTA = "/api/ocorrencias/estatisticas/bairro";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAgente;

    @BeforeEach
    void preparar() {
        tokenAgente = fixture.tokenComCargo("agente.bairros@itu.sp.gov.br", "Agente", "Bairros",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
    }

    @Test
    @DisplayName("[T45] conta todo o historico por grafia de bairro, igual ao banco, so com bairro e quantidade")
    void contaPorBairro() {
        String marcador = UUID.randomUUID().toString().substring(0, 6);
        String bairro = "Bairro Agregado " + marcador;
        criar(bairro, null);
        criar(bairro, "Denunciante Sigiloso " + marcador);
        criar(bairro.toLowerCase(), null);

        String corpo = given().header("Authorization", "Bearer " + tokenAgente)
                .when().get(ROTA)
                .then().statusCode(200)
                .extract().asString();
        assertThat(corpo.contains("Denunciante Sigiloso " + marcador), equalTo(false));
        List<Map<String, Object>> linhas = JsonPath.from(corpo).getList("$");

        Map<String, Long> porBairro = linhas.stream().collect(Collectors.toMap(
                linha -> (String) linha.get("bairro"), linha -> ((Number) linha.get("quantidade")).longValue()));
        assertThat(porBairro.get(bairro), equalTo(2L));
        assertThat(porBairro.get(bairro.toLowerCase()), equalTo(1L));
        assertThat(porBairro, equalTo(jdbcTemplate.query(
                "SELECT bairro, count(*) FROM ocorrencia WHERE bairro IS NOT NULL AND trim(bairro) <> '' GROUP BY bairro",
                (linha, i) -> Map.entry(linha.getString(1), linha.getLong(2))).stream()
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue))));
        for (Map<String, Object> linha : linhas) {
            assertThat(linha.keySet(), equalTo(Set.of("bairro", "quantidade")));
        }
        // Mais frequente primeiro: a ordem e a do grafico.
        List<Long> quantidades = linhas.stream().map(linha -> ((Number) linha.get("quantidade")).longValue()).toList();
        assertThat(quantidades, equalTo(quantidades.stream().sorted((a, b) -> Long.compare(b, a)).toList()));
        assertThat(linhas.stream().map(linha -> linha.get("bairro")).toList(), hasItem(bairro));
    }

    @Test
    @DisplayName("[T45] mesma autorizacao da listagem: Veterinario (sem acesso ao modulo desde a V11) recebe 403")
    void exigeLeituraDoModulo() {
        String tokenVeterinario = fixture.tokenComCargo("vet.bairros@itu.sp.gov.br", "Vet", "Bairros",
                ApiTesteFixture.CARGO_VETERINARIO_ID);
        given().header("Authorization", "Bearer " + tokenVeterinario).when().get(ROTA).then().statusCode(403);
        given().when().get(ROTA).then().statusCode(401);
    }

    // Com nome de denunciante: ocorrencia sigilosa (exige denunciante
    // identificado). Sem: anonima e nao sigilosa.
    private void criar(String bairro, String denuncianteSigiloso) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "irregular");
        corpo.put("dataAbertura", fixture.hoje().minusDays(1).toString());
        corpo.put("horaAbertura", "09:00");
        corpo.put("endereco", "Rua do Teste, 1");
        corpo.put("bairro", bairro);
        corpo.put("descricao", "Ocorrencia de teste da contagem por bairro");
        corpo.put("urgente", false);
        corpo.put("sigilosa", denuncianteSigiloso != null);
        corpo.put("anonima", denuncianteSigiloso == null);
        if (denuncianteSigiloso != null) {
            corpo.put("denunciante", Map.of("nome", denuncianteSigiloso));
        }
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAgente)
                .body(corpo).when().post("/api/ocorrencias").then().statusCode(200);
    }
}
