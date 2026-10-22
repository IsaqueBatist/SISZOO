package com.siszoo.animais;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.response.Response;

// F2-007 / RF-A04 (Fase 3 do TG): anexos do animal (V26) — upload JPG/PNG/PDF
// ate 5 MB, download com Content-Disposition, limite por animal e auditoria.
class AnexoAnimalControllerIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAdmin;
    private String animalId;

    @BeforeEach
    void preparar() {
        tokenAdmin = fixture.tokenAdmin("teste.admin.anexos.animal@itu.sp.gov.br", "Anexos");
        animalId = fixture.criarAnimal(tokenAdmin);
    }

    @Test
    @DisplayName("[F2-007] envia PNG, lista, baixa com o mesmo conteudo e audita CRIACAO em anexo_animal")
    void enviaListaEBaixa() throws IOException {
        byte[] png = png();

        Response enviado = given().header("Authorization", "Bearer " + tokenAdmin)
                .multiPart("arquivo", "foto-thor.png", png, "image/png")
                .multiPart("descricao", "Foto de entrada")
                .when().post("/api/animais/" + animalId + "/anexos");
        enviado.then().statusCode(200)
                .body("nome", equalTo("foto-thor.png"))
                .body("mimeType", equalTo("image/png"))
                .body("tamanho", equalTo(png.length))
                .body("descricao", equalTo("Foto de entrada"))
                .body("criadoPorNome", equalTo("Admin Anexos"));
        String anexoId = enviado.path("id");

        given().header("Authorization", "Bearer " + tokenAdmin).when().get("/api/animais/" + animalId + "/anexos")
                .then().statusCode(200).body("", hasSize(1)).body("[0].id", equalTo(anexoId));

        Response download = given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get("/api/animais/" + animalId + "/anexos/" + anexoId);
        download.then().statusCode(200).header("Content-Type", startsWith("image/png"))
                .header("Content-Disposition", startsWith("attachment"));
        assertThat(download.asByteArray(), equalTo(png));

        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM auditoria_evento WHERE entidade = 'anexo_animal'"
                + " AND acao = 'CRIACAO' AND entidade_id = CAST(? AS uuid)", Integer.class, anexoId), equalTo(1));
    }

    @Test
    @DisplayName("[F2-007] tipo nao permitido (texto) e animal inexistente: 422 e 404; Agente (leitura) nao envia: 403")
    void validacoes() {
        given().header("Authorization", "Bearer " + tokenAdmin)
                .multiPart("arquivo", "nota.txt", "conteudo qualquer".getBytes(), "text/plain")
                .when().post("/api/animais/" + animalId + "/anexos").then().statusCode(422);

        given().header("Authorization", "Bearer " + tokenAdmin)
                .multiPart("arquivo", "foto.png", pngOuVazio(), "image/png")
                .when().post("/api/animais/" + UUID.randomUUID() + "/anexos").then().statusCode(404);

        String tokenAgente = fixture.tokenComCargo("teste.agente.anexos.animal@itu.sp.gov.br", "Agente", "Anexos",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        given().header("Authorization", "Bearer " + tokenAgente)
                .multiPart("arquivo", "foto.png", pngOuVazio(), "image/png")
                .when().post("/api/animais/" + animalId + "/anexos").then().statusCode(403);
        given().header("Authorization", "Bearer " + tokenAgente)
                .when().get("/api/animais/" + animalId + "/anexos").then().statusCode(200);
    }

    private static byte[] png() throws IOException {
        BufferedImage imagem = new BufferedImage(4, 4, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        ImageIO.write(imagem, "png", saida);
        return saida.toByteArray();
    }

    private static byte[] pngOuVazio() {
        try {
            return png();
        } catch (IOException e) {
            return new byte[0];
        }
    }
}
