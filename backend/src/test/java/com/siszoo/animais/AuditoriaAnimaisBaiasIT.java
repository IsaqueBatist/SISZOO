package com.siszoo.animais;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.AtualizarBaiaRequest;
import com.siszoo.animais.dto.AtualizarStatusBaiaRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.dto.CriarBaiaRequest;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;

// RNF10 / F2-078 e F2-029 (Fase 3 do TG): o cadastro do animal e o da baia sao
// alteracoes criticas — cada escrita gera AuditoriaEvento com usuario,
// entidade_id e payload antes/depois. Ate a Fase 2, AnimalService e
// BaiaService nao auditavam nada (unico modulo sem trilha).
class AuditoriaAnimaisBaiasIT extends AbstractIntegrationTest {

    private static final String EMAIL_ADMIN = "teste.admin.auditoria.animais@itu.sp.gov.br";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAdmin;
    private UUID adminId;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Auditoria");
        adminId = jdbcTemplate.queryForObject("SELECT id FROM usuario WHERE email = ?", UUID.class, EMAIL_ADMIN);
    }

    @Test
    @DisplayName("[F2-029/RNF10] criar e editar animal geram CRIACAO e ATUALIZACAO com antes/depois e usuario")
    void animalCriadoEEditadoAuditado() {
        String baiaId = criarBaia("Baia Auditoria Animal");
        String microchip = fixture.microchipUnico();
        CriarAnimalRequest criar = new CriarAnimalRequest(
                "Auditado", "canino", "macho", "SRD", "Preto", "curta", "medio", null, "2 anos", null,
                microchip, false, null, "em_tratamento", "resgate", fixture.agora(),
                UUID.fromString(baiaId), null, null);
        String animalId = given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(criar).when().post("/api/animais").then().statusCode(200).extract().path("id");

        AtualizarAnimalRequest atualizar = new AtualizarAnimalRequest(
                "Auditado Renomeado", "canino", "macho", "SRD", "Preto", "curta", "medio", null, "2 anos", null,
                microchip, false, null, "em_tratamento", "resgate", fixture.agora(),
                UUID.fromString(baiaId), null, "editado");
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(atualizar).when().put("/api/animais/" + animalId).then().statusCode(200);

        List<Map<String, Object>> eventos = eventos("animal", animalId);
        assertThat(eventos, hasSize(2));
        assertThat(eventos.get(0).get("acao"), equalTo("CRIACAO"));
        assertThat(eventos.get(0).get("usuario_id"), equalTo(adminId));
        assertThat(eventos.get(0).get("antes"), nullValue());
        assertThat((String) eventos.get(0).get("depois"), containsString("\"nome\": \"Auditado\""));
        assertThat(eventos.get(1).get("acao"), equalTo("ATUALIZACAO"));
        assertThat(eventos.get(1).get("usuario_id"), equalTo(adminId));
        assertThat((String) eventos.get(1).get("antes"), containsString("\"nome\": \"Auditado\""));
        assertThat((String) eventos.get(1).get("depois"), containsString("\"nome\": \"Auditado Renomeado\""));
        assertThat((String) eventos.get(1).get("depois"), containsString("\"observacoes\": \"editado\""));
    }

    @Test
    @DisplayName("[F2-078/RNF10] criar, editar, desativar, reativar e excluir baia geram eventos com antes/depois")
    void baiaAuditadaEmTodasAsEscritas() {
        String baiaId = criarBaia("Baia Auditoria 1");

        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarBaiaRequest("Baia Auditoria 1B", "interna", (short) 7, "Quarentena", null))
                .when().put("/api/baias/" + baiaId).then().statusCode(200);
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarStatusBaiaRequest(false))
                .when().patch("/api/baias/" + baiaId + "/status").then().statusCode(200);
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarStatusBaiaRequest(true))
                .when().patch("/api/baias/" + baiaId + "/status").then().statusCode(200);
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().delete("/api/baias/" + baiaId).then().statusCode(200);

        List<Map<String, Object>> eventos = eventos("baia", baiaId);
        assertThat(eventos.stream().map(e -> e.get("acao")).toList(),
                equalTo(List.of("CRIACAO", "ATUALIZACAO", "DESATIVACAO", "REATIVACAO", "DESATIVACAO")));
        eventos.forEach(evento -> assertThat(evento.get("usuario_id"), equalTo(adminId)));
        assertThat(eventos.get(0).get("antes"), nullValue());
        assertThat((String) eventos.get(1).get("antes"), containsString("\"nome\": \"Baia Auditoria 1\""));
        assertThat((String) eventos.get(1).get("depois"), containsString("\"nome\": \"Baia Auditoria 1B\""));
        assertThat((String) eventos.get(1).get("depois"), containsString("\"capacidade\": 7"));
        assertThat((String) eventos.get(2).get("depois"), containsString("\"ativa\": false"));
        assertThat((String) eventos.get(3).get("depois"), containsString("\"ativa\": true"));
        assertThat((String) eventos.get(4).get("depois"), containsString("\"ativa\": false"));
        assertThat(eventos.get(4).get("depois"), notNullValue());
        assertThat((String) eventos.get(4).get("depois"), not(containsString("senha")));
    }

    private String criarBaia(String nome) {
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarBaiaRequest(nome, "interna", (short) 4, null, null))
                .when().post("/api/baias").then().statusCode(200).extract().path("id");
    }

    private List<Map<String, Object>> eventos(String entidade, String entidadeId) {
        return jdbcTemplate.queryForList("SELECT acao, usuario_id, payload_antes::text AS antes, payload_depois::text AS depois"
                + " FROM auditoria_evento WHERE entidade = ? AND entidade_id = CAST(? AS uuid) ORDER BY ocorreu_em, id",
                entidade, entidadeId);
    }
}
