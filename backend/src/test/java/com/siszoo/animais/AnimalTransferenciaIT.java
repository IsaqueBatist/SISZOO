package com.siszoo.animais;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;

import java.time.LocalDateTime;
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
import com.siszoo.animais.dto.CriarBaiaRequest;
import com.siszoo.animais.dto.TransferenciaRequest;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

@Import(RelogioTesteConfig.class)
class AnimalTransferenciaIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAdmin;
    private String microchip;
    private LocalDateTime entrada;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin("teste.admin.transferencia@itu.sp.gov.br", "Transferencia");
        microchip = fixture.microchipUnico();
        entrada = fixture.agora().minusDays(10);
    }

    @Test
    @DisplayName("mudar para transferido sem destino da 422 com o campo")
    void transferirSemDestino() {
        String animalId = criarAnimal(null);

        atualizar(animalId, "transferido", null, null).then().statusCode(422)
                .body("campos[0].campo", equalTo("transferencia.tipoDestino"));
        atualizar(animalId, "transferido", null,
                new TransferenciaRequest("ENTIDADE_PROTECAO", null, fixture.agora(), null)).then().statusCode(422)
                .body("campos[0].campo", equalTo("transferencia.destino"));
        atualizar(animalId, "transferido", null,
                new TransferenciaRequest("ENTIDADE_PROTECAO", "Abrigo Municipal", null, null)).then().statusCode(422)
                .body("campos[0].campo", equalTo("transferencia.dataSaida"));
    }

    @Test
    @DisplayName("tipo de destino fora da lista, saida futura ou antes da entrada dao 422")
    void validacoesDoDestino() {
        String animalId = criarAnimal(null);

        atualizar(animalId, "transferido", null,
                new TransferenciaRequest("ADOTANTE", "Fulano", fixture.agora(), null)).then().statusCode(422)
                .body("campos[0].campo", equalTo("transferencia.tipoDestino"));
        atualizar(animalId, "transferido", null,
                new TransferenciaRequest("OUTRO_CCZ", "CCZ de Sorocaba", fixture.agora().plusDays(1), null))
                .then().statusCode(422).body("mensagem", equalTo("A data de saída não pode ser futura."));
        atualizar(animalId, "transferido", null,
                new TransferenciaRequest("OUTRO_CCZ", "CCZ de Sorocaba", entrada.minusDays(1), null))
                .then().statusCode(422).body("mensagem", equalTo("A data de saída não pode ser anterior à data de entrada."));
    }

    @Test
    @DisplayName("destino informado com status que nao e transferido da 422")
    void destinoSemTransferencia() {
        String animalId = criarAnimal(null);

        atualizar(animalId, "em_tratamento", null,
                new TransferenciaRequest("OUTRO_CCZ", "CCZ de Sorocaba", fixture.agora(), null))
                .then().statusCode(422).body("campos[0].campo", equalTo("transferencia"));
    }

    @Test
    @DisplayName("transferencia completa grava o destino, libera a vaga da baia e audita")
    void transferenciaCompleta() {
        String baiaId = given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarBaiaRequest("Transf " + microchip.substring(microchip.length() - 6), "interna", (short) 2, null, null))
                .when().post("/api/baias").then().statusCode(200).extract().path("id");
        String animalId = criarAnimal(UUID.fromString(baiaId));
        assertThat(ocupacao(baiaId), equalTo(1));
        LocalDateTime saida = fixture.agora().withNano(0);

        atualizar(animalId, "transferido", UUID.fromString(baiaId),
                new TransferenciaRequest("ORGAO_PUBLICO", "Prefeitura de Salto", saida, "Ofício 12/2026"))
                .then().statusCode(200)
                .body("statusCodigo", equalTo("transferido"))
                .body("tipoDestinoTransferencia", equalTo("ORGAO_PUBLICO"))
                .body("destinoTransferencia", equalTo("Prefeitura de Salto"))
                .body("documentoTransferencia", equalTo("Ofício 12/2026"))
                .body("dataSaida", startsWith(saida.toLocalDate().toString()));

        assertThat(ocupacao(baiaId), equalTo(0));
        List<Map<String, Object>> eventos = jdbcTemplate.queryForList(
                "SELECT CAST(payload_depois AS text) AS depois FROM auditoria_evento"
                        + " WHERE entidade = 'animal' AND acao = 'ATUALIZACAO' AND entidade_id = CAST(? AS uuid)",
                animalId);
        assertThat(eventos, hasSize(1));
        assertThat((String) eventos.get(0).get("depois"), containsString("Prefeitura de Salto"));
    }

    @Test
    @DisplayName("transferencia registrada nao pode ser alterada; edicao sem o bloco mantem o destino")
    void transferenciaImutavel() {
        String animalId = criarAnimal(null);
        LocalDateTime saida = fixture.agora().withNano(0);
        atualizar(animalId, "transferido", null,
                new TransferenciaRequest("ENTIDADE_PROTECAO", "Associação Protetora", saida, null))
                .then().statusCode(200);

        atualizar(animalId, "transferido", null,
                new TransferenciaRequest("ENTIDADE_PROTECAO", "Outra Associação", saida, null))
                .then().statusCode(422).body("mensagem", equalTo("A transferência já registrada não pode ser alterada."));
        atualizar(animalId, "transferido", null,
                new TransferenciaRequest("OUTRO", "Associação Protetora", saida, null))
                .then().statusCode(422);

        atualizar(animalId, "transferido", null, null).then().statusCode(200)
                .body("destinoTransferencia", equalTo("Associação Protetora"));
        String gravado = jdbcTemplate.queryForObject(
                "SELECT destino_transferencia FROM animal WHERE id = CAST(? AS uuid)", String.class, animalId);
        assertThat(gravado, equalTo("Associação Protetora"));
    }

    private String criarAnimal(UUID baiaId) {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Animal Transferencia", "canino", "macho", null, null, null, null, null, null, null,
                microchip, false, null, "disponivel_adocao", "resgate", entrada, baiaId, null, null,
                null, null, null, null);
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(request).when().post("/api/animais").then().statusCode(200).extract().path("id");
    }

    private Response atualizar(String animalId, String status, UUID baiaId, TransferenciaRequest transferencia) {
        AtualizarAnimalRequest request = new AtualizarAnimalRequest(
                "Animal Transferencia", "canino", "macho", null, null, null, null, null, null, null,
                microchip, false, null, status, "resgate", entrada, baiaId, null, null,
                null, null, null, null, null, null, transferencia);
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(request).when().put("/api/animais/" + animalId);
    }

    private int ocupacao(String baiaId) {
        return given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get("/api/baias/" + baiaId).then().statusCode(200).extract().path("ocupacaoAtual");
    }
}
