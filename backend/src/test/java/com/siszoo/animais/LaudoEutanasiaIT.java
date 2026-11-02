package com.siszoo.animais;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.startsWith;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.dto.EutanasiaRequest;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

@Import(RelogioTesteConfig.class)
class LaudoEutanasiaIT extends AbstractIntegrationTest {

    private static final String EMAIL_VET = "vet.laudo.eutanasia@itu.sp.gov.br";
    private static final String LAUDO = "Neoplasia disseminada, sem resposta ao tratamento";
    private static final EutanasiaRequest COMPLETA = new EutanasiaRequest("Anestesia geral e barbitúrico intravenoso", true);

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAdmin;
    private String tokenVet;
    private String microchip;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin("admin.laudo.eutanasia@itu.sp.gov.br", "LaudoEutanasia");
        tokenVet = fixture.tokenVeterinario(EMAIL_VET, "LaudoEutanasia");
        microchip = fixture.microchipUnico();
    }

    @Test
    @DisplayName("administrador sem CRMV nao registra eutanasia, nem com o laudo completo: 403")
    void administradorSemCrmvRecebe403() {
        String id = criarAnimal();

        atualizar(tokenAdmin, id, LAUDO, COMPLETA).then().statusCode(403)
                .body("mensagem", equalTo("Só veterinário com CRMV cadastrado pode registrar o laudo de eutanásia."));
        microchip = fixture.microchipUnico();
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(corpoCriacao("obito_eutanasia", LAUDO, COMPLETA)).when().post("/api/animais")
                .then().statusCode(403);
    }

    @Test
    @DisplayName("administrador com CRMV mas sem o cargo de Veterinario tambem recebe 403")
    void crmvSemCargoDeVeterinario() {
        jdbcTemplate.update("UPDATE usuario SET crmv = 'SP-77777' WHERE email = ?", "admin.laudo.eutanasia@itu.sp.gov.br");
        String id = criarAnimal();

        atualizar(tokenAdmin, id, LAUDO, COMPLETA).then().statusCode(403);
    }

    @Test
    @DisplayName("veterinario com CRMV registra o laudo com responsavel, CRMV copiado, metodo e data; auditado")
    void veterinarioRegistraLaudo() {
        String id = criarAnimal();
        UUID vetId = jdbcTemplate.queryForObject("SELECT id FROM usuario WHERE email = ?", UUID.class, EMAIL_VET);

        atualizar(tokenVet, id, LAUDO, COMPLETA).then().statusCode(200)
                .body("statusCodigo", equalTo("obito_eutanasia"))
                .body("laudoEutanasia", equalTo(LAUDO))
                .body("laudoEutanasiaResponsavelId", equalTo(vetId.toString()))
                .body("laudoEutanasiaResponsavelNome", equalTo("Vet LaudoEutanasia"))
                .body("laudoEutanasiaCrmv", equalTo("SP-00001"))
                .body("laudoEutanasiaMetodo", equalTo("Anestesia geral e barbitúrico intravenoso"))
                .body("laudoEutanasiaInsensibilizacaoPrevia", equalTo(true))
                .body("laudoEutanasiaRegistradoEm", startsWith(RelogioTesteConfig.HOJE.toString()));

        List<Map<String, Object>> eventos = jdbcTemplate.queryForList(
                "SELECT CAST(payload_depois AS text) AS depois FROM auditoria_evento"
                        + " WHERE entidade = 'animal' AND acao = 'ATUALIZACAO' AND entidade_id = CAST(? AS uuid)", id);
        assertThat(eventos, hasSize(1));
        assertThat((String) eventos.get(0).get("depois"), containsString("SP-00001"));
    }

    @Test
    @DisplayName("sem metodo, sem resposta sobre insensibilizacao ou com insensibilizacao = false: 422")
    void camposObrigatoriosEInsensibilizacao() {
        String id = criarAnimal();

        atualizar(tokenVet, id, LAUDO, new EutanasiaRequest(null, true)).then().statusCode(422)
                .body("campos[0].campo", equalTo("eutanasia.metodo"));
        atualizar(tokenVet, id, LAUDO, new EutanasiaRequest("Barbitúrico", null)).then().statusCode(422)
                .body("campos[0].campo", equalTo("eutanasia.insensibilizacaoPrevia"));
        atualizar(tokenVet, id, LAUDO, new EutanasiaRequest("Barbitúrico", false)).then().statusCode(422)
                .body("campos[0].campo", equalTo("eutanasia.insensibilizacaoPrevia"))
                .body("mensagem", containsString("insensibilização prévia"));
    }

    @Test
    @DisplayName("laudo gravado nao pode ser editado depois")
    void laudoImutavel() {
        String id = criarAnimal();
        atualizar(tokenVet, id, LAUDO, COMPLETA).then().statusCode(200);

        atualizar(tokenVet, id, LAUDO + " (corrigido)", null).then().statusCode(422)
                .body("mensagem", equalTo("O laudo de eutanásia já registrado não pode ser alterado."));
        atualizar(tokenVet, id, LAUDO, new EutanasiaRequest("Outro método", true)).then().statusCode(422);
        atualizar(tokenVet, id, null, null).then().statusCode(200).body("laudoEutanasia", equalTo(LAUDO));
    }

    @Test
    @DisplayName("mudar o CRMV do usuario depois nao muda o CRMV gravado no laudo")
    void crmvGravadoNaoAcompanhaOUsuario() {
        String id = criarAnimal();
        atualizar(tokenVet, id, LAUDO, COMPLETA).then().statusCode(200);

        jdbcTemplate.update("UPDATE usuario SET crmv = 'SP-99999' WHERE email = ?", EMAIL_VET);

        given().header("Authorization", "Bearer " + tokenVet).when().get("/api/animais/" + id)
                .then().statusCode(200).body("laudoEutanasiaCrmv", equalTo("SP-00001"));
        String gravado = jdbcTemplate.queryForObject(
                "SELECT laudo_eutanasia_crmv FROM animal WHERE id = CAST(? AS uuid)", String.class, id);
        assertThat(gravado, equalTo("SP-00001"));
        jdbcTemplate.update("UPDATE usuario SET crmv = 'SP-00001' WHERE email = ?", EMAIL_VET);
    }

    @Test
    @DisplayName("cadastro direto pela API ja em eutanasia segue as mesmas regras")
    void cadastroDiretoPelaApi() {
        Response criado = given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenVet)
                .body(corpoCriacao("obito_eutanasia", LAUDO, COMPLETA)).when().post("/api/animais");

        criado.then().statusCode(200).body("laudoEutanasiaRegistradoEm", notNullValue());
        microchip = fixture.microchipUnico();
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenVet)
                .body(corpoCriacao("obito_eutanasia", LAUDO, new EutanasiaRequest("Barbitúrico", false)))
                .when().post("/api/animais").then().statusCode(422);
    }

    private String criarAnimal() {
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(corpoCriacao("em_tratamento", null, null)).when().post("/api/animais")
                .then().statusCode(200).extract().path("id");
    }

    private CriarAnimalRequest corpoCriacao(String status, String laudo, EutanasiaRequest eutanasia) {
        return new CriarAnimalRequest("Animal Laudo", "canino", "macho", null, null, null, null, null, null, null,
                microchip, false, null, status, "resgate", fixture.agora().minusDays(5), null, null, null,
                null, null, null, laudo, null, null, null, eutanasia);
    }

    private Response atualizar(String token, String id, String laudo, EutanasiaRequest eutanasia) {
        AtualizarAnimalRequest request = new AtualizarAnimalRequest("Animal Laudo", "canino", "macho", null, null,
                null, null, null, null, null, microchip, false, null, "obito_eutanasia", "resgate",
                fixture.agora().minusDays(5), null, null, null, null, null, null, laudo, null, null, null, eutanasia);
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + token)
                .body(request).when().put("/api/animais/" + id);
    }
}
