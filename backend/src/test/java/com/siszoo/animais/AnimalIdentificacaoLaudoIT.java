package com.siszoo.animais;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.dto.CriarBaiaRequest;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// F2-004 (numero_medalha, data_implantacao_chip, procedencia — V23) e F2-008
// (laudo_eutanasia — V24), Fase 3 do TG (22/10/2026). As validacoes ficam no
// AnimalService e respondem 422 com o nome do campo (CampoInvalidoException).
class AnimalIdentificacaoLaudoIT extends AbstractIntegrationTest {

    private static final String EMAIL_ADMIN = "teste.admin.identificacao@itu.sp.gov.br";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAdmin;
    private UUID baiaId;

    @BeforeEach
    void preparar() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Identificacao");
        baiaId = UUID.fromString(given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarBaiaRequest("Baia Ident " + UUID.randomUUID().toString().substring(0, 8), "interna", (short) 5, null, null))
                .when().post("/api/baias").then().statusCode(200).extract().path("id"));
    }

    @Test
    @DisplayName("[F2-004] cadastro grava e devolve medalha, data de implantacao do chip e procedencia")
    void cadastroComIdentificacaoComplementar() {
        String microchip = fixture.microchipUnico();
        String medalha = "M-" + UUID.randomUUID().toString().substring(0, 8);
        LocalDate implantacao = fixture.hoje().minusDays(3);

        Response resposta = criar(corpo("Rex", microchip, "em_tratamento", medalha, implantacao, "Recolhido na Rua das Flores", null));

        resposta.then().statusCode(200);
        assertThat(resposta.path("numeroMedalha"), equalTo(medalha));
        assertThat(resposta.path("dataImplantacaoChip"), equalTo(implantacao.toString()));
        assertThat(resposta.path("procedencia"), equalTo("Recolhido na Rua das Flores"));
        assertThat(resposta.path("laudoEutanasia"), nullValue());
        String id = resposta.path("id");
        assertThat(jdbcTemplate.queryForObject("SELECT numero_medalha FROM animal WHERE id = CAST(? AS uuid)", String.class, id),
                equalTo(medalha));
    }

    @Test
    @DisplayName("[F2-004] medalha repetida em outro animal: 422 no campo numeroMedalha")
    void medalhaDuplicadaRecusada() {
        String medalha = "M-" + UUID.randomUUID().toString().substring(0, 8);
        criar(corpo("Primeiro", fixture.microchipUnico(), "em_tratamento", medalha, null, null, null)).then().statusCode(200);

        criar(corpo("Segundo", fixture.microchipUnico(), "em_tratamento", " " + medalha + " ", null, null, null))
                .then().statusCode(422).body("campos[0].campo", equalTo("numeroMedalha"));
    }

    @Test
    @DisplayName("[F2-004/RN01] data de implantacao sem microchip ou futura: 422 no campo dataImplantacaoChip")
    void dataImplantacaoExigeMicrochipENaoEhFutura() {
        criar(corpo("Sem chip", null, "em_tratamento", null, fixture.hoje(), null, null))
                .then().statusCode(422).body("campos[0].campo", equalTo("dataImplantacaoChip"));
        criar(corpo("Futura", fixture.microchipUnico(), "em_tratamento", null, fixture.hoje().plusDays(1), null, null))
                .then().statusCode(422).body("campos[0].campo", equalTo("dataImplantacaoChip"));
    }

    @Test
    @DisplayName("[F2-008] cadastro ja em obito_eutanasia sem laudo: 422; com laudo: grava")
    void eutanasiaNoCadastroExigeLaudo() {
        criar(corpo("Sem laudo", fixture.microchipUnico(), "obito_eutanasia", null, null, null, null))
                .then().statusCode(422).body("campos[0].campo", equalTo("laudoEutanasia"));

        Response ok = criar(corpo("Com laudo", fixture.microchipUnico(), "obito_eutanasia", null, null, null,
                "Laudo do responsavel tecnico: quadro irreversivel"));
        ok.then().statusCode(200);
        assertThat(ok.path("laudoEutanasia"), equalTo("Laudo do responsavel tecnico: quadro irreversivel"));
    }

    @Test
    @DisplayName("[F2-008] transicao para obito_eutanasia na edicao exige laudo; registro ja em eutanasia sem laudo continua editavel")
    void transicaoParaEutanasiaExigeLaudoMasNaoInvalidaExistentes() {
        String microchip = fixture.microchipUnico();
        String id = criar(corpo("Transicao", microchip, "em_tratamento", null, null, null, null))
                .then().statusCode(200).extract().path("id");

        atualizar(id, corpoAtualizar("Transicao", microchip, "obito_eutanasia", null))
                .then().statusCode(422).body("campos[0].campo", equalTo("laudoEutanasia"));
        atualizar(id, corpoAtualizar("Transicao", microchip, "obito_eutanasia", "Laudo: sofrimento irreversivel"))
                .then().statusCode(200).body("laudoEutanasia", equalTo("Laudo: sofrimento irreversivel"));

        // Registro anterior a V24: ja em eutanasia e sem laudo (gravado direto no
        // banco). A edicao sem laudo nao pode ser recusada (regra so na transicao).
        jdbcTemplate.update("UPDATE animal SET laudo_eutanasia = NULL WHERE id = CAST(? AS uuid)", id);
        atualizar(id, corpoAtualizar("Transicao editado", microchip, "obito_eutanasia", null))
                .then().statusCode(200).body("nome", equalTo("Transicao editado")).body("laudoEutanasia", nullValue());
    }

    @Test
    @DisplayName("[F2-008] laudo ja gravado e mantido quando a edicao vem sem laudo")
    void laudoGravadoEhMantido() {
        String microchip = fixture.microchipUnico();
        String id = criar(corpo("Mantem", microchip, "obito_eutanasia", null, null, null, "Laudo original"))
                .then().statusCode(200).extract().path("id");

        atualizar(id, corpoAtualizar("Mantem", microchip, "obito_eutanasia", null))
                .then().statusCode(200).body("laudoEutanasia", equalTo("Laudo original"));
    }

    // ── Apoio ────────────────────────────────────────────

    private Response criar(CriarAnimalRequest corpo) {
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(corpo).when().post("/api/animais");
    }

    private Response atualizar(String id, AtualizarAnimalRequest corpo) {
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(corpo).when().put("/api/animais/" + id);
    }

    private CriarAnimalRequest corpo(String nome, String microchip, String status, String medalha, LocalDate implantacao,
            String procedencia, String laudo) {
        // Fora da custodia (obito) o animal nao ocupa baia.
        UUID baia = "obito_eutanasia".equals(status) ? null : baiaId;
        return new CriarAnimalRequest(nome, "canino", "macho", "SRD", "Preto", "curta", "medio", null, "2 anos", null,
                microchip, false, null, status, "resgate", fixture.agora(), baia, null, null,
                medalha, implantacao, procedencia, laudo);
    }

    private AtualizarAnimalRequest corpoAtualizar(String nome, String microchip, String status, String laudo) {
        UUID baia = "obito_eutanasia".equals(status) ? null : baiaId;
        return new AtualizarAnimalRequest(nome, "canino", "macho", "SRD", "Preto", "curta", "medio", null, "2 anos", null,
                microchip, false, null, status, "resgate", fixture.agora(), baia, null, null,
                null, null, null, laudo);
    }
}
