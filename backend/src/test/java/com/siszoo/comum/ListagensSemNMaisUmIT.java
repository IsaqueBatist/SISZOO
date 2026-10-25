package com.siszoo.comum;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThan;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.ocorrencias.SqlCapturado;

import io.restassured.http.ContentType;
import io.restassured.path.json.JsonPath;

// T45: as listagens de animais e de auditoria carregam as relacoes que o
// mapper le numa consulta so (EntityGraph). Sem isso, cada autor/especie
// distinto da pagina custava uma consulta a mais (N+1). O teste compara o
// numero de comandos SQL de uma pagina com 1 linha e de uma com varias linhas
// de autores (e especies) diferentes: tem de ser o mesmo.
// Mesmas anotacoes de AnexoOcorrenciaQueriesIT/AuditoriaSigiloSqlIT para
// reaproveitar o contexto em cache que ja tem o SqlCapturado ligado.
@Import(RelogioTesteConfig.class)
@TestPropertySource(properties =
        "spring.jpa.properties.hibernate.session_factory.statement_inspector=com.siszoo.ocorrencias.SqlCapturado")
class ListagensSemNMaisUmIT extends AbstractIntegrationTest {

    private static final int AUTORES = 5;

    @Autowired
    private ApiTesteFixture fixture;

    @Test
    void listagemDeAnimaisNaoFazUmaConsultaPorLinha() {
        String marca = marcaEmLetras();
        String token = null;
        for (int i = 0; i < AUTORES; i++) {
            token = fixture.tokenAdmin(email(i, marca), "Autor" + letra(i));
            criarAnimal(token, marca + " " + letra(i), i % 2 == 0 ? "canino" : "felino");
        }

        Listagem umaLinha = listar(token, "/api/animais?q=" + marca + " " + letra(0) + "&tamanho=20");
        Listagem variasLinhas = listar(token, "/api/animais?q=" + marca + "&tamanho=20");

        assertThat(umaLinha.itens().getList("itens").size(), equalTo(1));
        assertThat(variasLinhas.itens().getList("itens").size(), equalTo(AUTORES));
        assertThat(variasLinhas.comandos(), equalTo(umaLinha.comandos()));
    }

    @Test
    void listagemDeAuditoriaNaoFazUmaConsultaPorUsuario() {
        String marca = marcaEmLetras();
        String primeiroEmail = email(0, marca);
        String token = null;
        // Cada login grava um evento LOGIN com o proprio usuario.
        for (int i = 0; i < AUTORES; i++) {
            token = fixture.tokenAdmin(email(i, marca), "Logs" + letra(i));
        }

        Listagem umUsuario = listar(token, "/api/auditoria?acao=LOGIN&usuarioEmail=" + primeiroEmail + "&tamanho=20");
        Listagem variosUsuarios = listar(token, "/api/auditoria?acao=LOGIN&tamanho=20");

        assertThat(new HashSet<>(umUsuario.itens().getList("itens.usuarioEmail")).size(), equalTo(1));
        // Sem autores distintos na pagina a comparacao nao provaria nada.
        assertThat(new HashSet<>(variosUsuarios.itens().getList("itens.usuarioEmail")).size(), greaterThan(1));
        assertThat(variosUsuarios.comandos(), equalTo(umUsuario.comandos()));
    }

    private record Listagem(JsonPath itens, int comandos) {
    }

    // O e-mail institucional so aceita letras minusculas e ponto (LoginRequest).
    private static String marcaEmLetras() {
        StringBuilder marca = new StringBuilder("nmaisum");
        for (char c : UUID.randomUUID().toString().replace("-", "").substring(0, 10).toCharArray()) {
            marca.append((char) ('a' + Character.digit(c, 16)));
        }
        return marca.toString();
    }

    private static char letra(int indice) {
        return (char) ('a' + indice);
    }

    private static String email(int indice, String marca) {
        return "autor" + letra(indice) + "." + marca + "@itu.sp.gov.br";
    }

    private Listagem listar(String token, String caminho) {
        SqlCapturado.limpar();
        JsonPath corpo = given().header("Authorization", "Bearer " + token)
                .when().get(caminho)
                .then().statusCode(200)
                .extract().jsonPath();
        List<String> comandos = SqlCapturado.comandos();
        return new Listagem(corpo, comandos.size());
    }

    private void criarAnimal(String token, String nome, String especie) {
        CriarAnimalRequest request = new CriarAnimalRequest(
                nome, especie, "macho", null, null, null, null, null, null, null,
                fixture.microchipUnico(), false, null, "disponivel_adocao", "resgate", fixture.agora(), null, null, null,
                null, null, null, null);
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + token)
                .body(request)
                .when().post("/api/animais")
                .then().statusCode(200);
    }
}
