package com.siszoo.animais;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.lessThan;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.dto.CriarBaiaRequest;
import com.siszoo.animais.service.FotoMiniaturaBackfill;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.path.json.JsonPath;

// T45 (V28): as listagens de animais devolvem em fotoUrl a miniatura da foto
// (avatar), e o detalhe continua com a foto inteira; a Gestao de Baias le os
// residentes de GET /api/baias/residentes, sem a listagem de 500 animais.
class FotoMiniaturaIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private FotoMiniaturaBackfill backfill;

    private String tokenAdmin;
    private String marca;

    @BeforeEach
    void preparar() {
        tokenAdmin = fixture.tokenAdmin("admin.miniatura@itu.sp.gov.br", "Miniatura");
        marca = "Mini" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    @DisplayName("[T45] listagem com miniatura; detalhe, criacao e edicao com a foto inteira")
    void listagemDevolveMiniaturaEDetalheAFotoInteira() throws IOException {
        String foto = foto(800, 600);
        String id = criar(marca, foto, null, "disponivel_adocao");

        String naListagem = itemDaListagem(marca).getString("fotoUrl");
        assertThat(naListagem, startsWith("data:image/jpeg;base64,"));
        assertThat(naListagem.length(), lessThan(foto.length() / 5));
        assertThat(detalhe(id).getString("fotoUrl"), equalTo(foto));

        // Editar a ficha sem trocar a foto nao refaz a miniatura.
        String miniaturaGravada = miniaturaNoBanco(id);
        atualizar(id, marca + " editado", foto);
        assertThat(miniaturaNoBanco(id), equalTo(miniaturaGravada));
        assertThat(detalhe(id).getString("fotoUrl"), equalTo(foto));

        // Trocar a foto refaz; tirar a foto tira a miniatura.
        String outraFoto = foto(300, 400);
        atualizar(id, marca + " editado", outraFoto);
        assertThat(miniaturaNoBanco(id), not(equalTo(miniaturaGravada)));
        assertThat(itemDaListagem(marca).getString("fotoUrl"), equalTo(miniaturaNoBanco(id)));
        atualizar(id, marca + " editado", null);
        assertThat(miniaturaNoBanco(id), nullValue());
        assertThat(itemDaListagem(marca).getString("fotoUrl"), nullValue());
    }

    @Test
    @DisplayName("[T45] URL externa vai igual para a listagem; foto ilegivel fica sem miniatura")
    void urlExternaEFotoIlegivel() {
        String comUrl = criar(marca + " url", "https://exemplo.org/gato.jpg", null, "disponivel_adocao");
        String ilegivel = criar(marca + " ilegivel", "data:image/png;base64,AAAA", null, "disponivel_adocao");

        assertThat(itemDaListagem(marca + " url").getString("fotoUrl"), equalTo("https://exemplo.org/gato.jpg"));
        assertThat(itemDaListagem(marca + " ilegivel").getString("fotoUrl"), nullValue());
        assertThat(detalhe(comUrl).getString("fotoUrl"), equalTo("https://exemplo.org/gato.jpg"));
        assertThat(detalhe(ilegivel).getString("fotoUrl"), equalTo("data:image/png;base64,AAAA"));
    }

    @Test
    @DisplayName("[T45] backfill gera a miniatura das fotos gravadas antes da V28, uma vez so")
    void backfillDasFotosAntigas() throws IOException {
        String id = criar(marca, null, null, "disponivel_adocao");
        // Como uma linha anterior a V28: foto sem miniatura.
        jdbcTemplate.update("UPDATE animal SET foto_url = ?, foto_miniatura = NULL WHERE id = CAST(? AS uuid)",
                foto(640, 480), id);

        assertThat(backfill.executar().geradas() >= 1, equalTo(true));
        assertThat(miniaturaNoBanco(id), startsWith("data:image/jpeg;base64,"));
        String gerada = miniaturaNoBanco(id);

        backfill.executar();
        assertThat(miniaturaNoBanco(id), equalTo(gerada));
    }

    @Test
    @DisplayName("[T45] residentes por baia: so quem esta sob custodia, com nome e miniatura")
    void residentesPorBaia() throws IOException {
        String baiaId = given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarBaiaRequest("Baia " + marca, "interna", (short) 5, null, null))
                .when().post("/api/baias").then().statusCode(200).extract().path("id");
        String residente = criar(marca + " residente", foto(800, 600), UUID.fromString(baiaId), "disponivel_adocao");
        String adotado = criar(marca + " adotado", null, UUID.fromString(baiaId), "disponivel_adocao");
        atualizarStatusParaAdotado(adotado);

        List<Map<String, Object>> residentes = given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get("/api/baias/residentes").then().statusCode(200)
                .extract().jsonPath().getList("findAll { it.baiaId == '" + baiaId + "' }");

        assertThat(residentes.stream().map(r -> r.get("id")).toList(), equalTo(List.of(residente)));
        Map<String, Object> linha = residentes.get(0);
        assertThat(linha.keySet(), equalTo(Set.of("baiaId", "id", "nome", "fotoUrl")));
        assertThat(linha.get("nome"), equalTo(marca + " residente"));
        assertThat(linha.get("fotoUrl"), equalTo(miniaturaNoBanco(residente)));

        List<String> todos = given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get("/api/baias/residentes").then().extract().jsonPath().getList("id");
        assertThat(todos, not(hasItem(adotado)));
    }

    @Test
    @DisplayName("[T45] residentes por baia exige GESTAO_ANIMAIS:leitura")
    void residentesExigemLeituraDeAnimais() {
        String email = "sem.cargo.residentes@itu.sp.gov.br";
        if (jdbcTemplate.queryForObject("SELECT count(*) FROM usuario WHERE email = ?", Long.class, email) == 0) {
            fixture.criarUsuarioSemCargo(email, "Sem", "Cargo");
        }
        String semCargo = fixture.login(email, "SenhaTeste123");
        given().header("Authorization", "Bearer " + semCargo).when().get("/api/baias/residentes").then().statusCode(403);
        given().when().get("/api/baias/residentes").then().statusCode(401);
    }

    private String criar(String nome, String fotoUrl, UUID baiaId, String status) {
        CriarAnimalRequest request = new CriarAnimalRequest(
                nome, "canino", "macho", null, null, null, null, null, null, null,
                fixture.microchipUnico(), false, null, status, "resgate", fixture.agora(), baiaId, fotoUrl, null,
                null, null, null, null);
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(request).when().post("/api/animais")
                .then().statusCode(200).extract().path("id");
    }

    private void atualizar(String id, String nome, String fotoUrl) {
        JsonPath atual = detalhe(id);
        AtualizarAnimalRequest request = new AtualizarAnimalRequest(
                nome, atual.getString("especieCodigo"), atual.getString("sexo"), null, null, null, null, null, null, null,
                atual.getString("microchip"), false, null, atual.getString("statusCodigo"),
                atual.getString("motivoEntradaCodigo"), fixture.agora(), null, fotoUrl, null, null, null, null, null);
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(request).when().put("/api/animais/" + id).then().statusCode(200);
    }

    private void atualizarStatusParaAdotado(String id) {
        JsonPath atual = detalhe(id);
        AtualizarAnimalRequest request = new AtualizarAnimalRequest(
                atual.getString("nome"), atual.getString("especieCodigo"), atual.getString("sexo"), null, null, null,
                null, null, null, null, atual.getString("microchip"), false, null, "adotado",
                atual.getString("motivoEntradaCodigo"), fixture.agora(), null, null, null, null, null, null, null);
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(request).when().put("/api/animais/" + id).then().statusCode(200);
    }

    private JsonPath detalhe(String id) {
        return given().header("Authorization", "Bearer " + tokenAdmin).when().get("/api/animais/" + id)
                .then().statusCode(200).extract().jsonPath();
    }

    private JsonPath itemDaListagem(String nome) {
        JsonPath pagina = given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get("/api/animais?q=" + nome + "&tamanho=20")
                .then().statusCode(200).extract().jsonPath();
        assertThat(pagina.getList("itens").size(), equalTo(1));
        return JsonPath.from(pagina.prettify()).setRootPath("itens[0]");
    }

    private String miniaturaNoBanco(String id) {
        return jdbcTemplate.queryForObject("SELECT foto_miniatura FROM animal WHERE id = CAST(? AS uuid)", String.class, id);
    }

    private static String foto(int largura, int altura) throws IOException {
        BufferedImage imagem = new BufferedImage(largura, altura, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < altura; y += 8) {
            for (int x = 0; x < largura; x += 8) {
                imagem.setRGB(x, y, (x * 31 + y * 17) & 0xffffff);
            }
        }
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        ImageIO.write(imagem, "jpeg", bytes);
        return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(bytes.toByteArray());
    }
}
