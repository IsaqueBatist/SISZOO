package com.siszoo.comum.security;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;

// Pendencia FS-P1: corpo invalido enviado por um perfil sem permissao recebia
// 422 (o @Valid roda antes do @PreAuthorize do metodo). A ordem esperada e:
// sem autenticacao -> 401; autenticado sem permissao -> 403, qualquer que
// seja o corpo; com permissao e corpo invalido -> 422 no formato padrao.
class AutorizacaoAntesDaValidacaoIT extends AbstractIntegrationTest {

    private static final UUID CARGO_ADMIN = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID CARGO_VETERINARIO = UUID.fromString("00000000-0000-4000-8000-000000000002");
    private static final UUID CARGO_AGENTE = UUID.fromString("00000000-0000-4000-8000-000000000003");

    // Corpo sem nenhum campo obrigatorio: e invalido para qualquer cadastro.
    private static final String CORPO_INVALIDO = "{}";

    @Autowired
    private ApiTesteFixture fixture;

    private String tokenAdmin;
    private String tokenVeterinario;
    private String tokenAgente;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenComCargo("admin.ordem.autorizacao@itu.sp.gov.br", "Admin", "Ordem", CARGO_ADMIN);
        tokenVeterinario = fixture.tokenComCargo("vet.ordem.autorizacao@itu.sp.gov.br", "Vet", "Ordem", CARGO_VETERINARIO);
        tokenAgente = fixture.tokenComCargo("agente.ordem.autorizacao@itu.sp.gov.br", "Agente", "Ordem", CARGO_AGENTE);
    }

    private RequestSpecification comCorpoInvalido(String token) {
        RequestSpecification spec = given().contentType(ContentType.JSON).body(CORPO_INVALIDO);
        return token == null ? spec : spec.header("Authorization", "Bearer " + token);
    }

    @Test
    @DisplayName("cadastro de animal com corpo invalido: autorizado 422, sem permissao 403, sem token 401")
    void cadastroDeAnimal() {
        comCorpoInvalido(tokenAdmin).post("/api/animais").then()
                .statusCode(422)
                .body("mensagem", equalTo("Dados invalidos"));

        // Agente Sanitario so le GESTAO_ANIMAIS (V3).
        comCorpoInvalido(tokenAgente).post("/api/animais").then()
                .statusCode(403)
                .body("mensagem", equalTo("Acesso negado"));

        comCorpoInvalido(null).post("/api/animais").then()
                .statusCode(401)
                .body("mensagem", equalTo("Nao autorizado"));
    }

    @Test
    @DisplayName("edicao de animal com corpo invalido: sem permissao 403 antes da validacao e da busca")
    void edicaoDeAnimal() {
        String idQualquer = UUID.randomUUID().toString();

        comCorpoInvalido(tokenAgente).put("/api/animais/" + idQualquer).then()
                .statusCode(403)
                .body("mensagem", equalTo("Acesso negado"));

        comCorpoInvalido(tokenAdmin).put("/api/animais/" + idQualquer).then()
                .statusCode(422)
                .body("mensagem", equalTo("Dados invalidos"));
    }

    @Test
    @DisplayName("cadastro de usuario com corpo invalido: so o Administrador chega a validacao")
    void cadastroDeUsuario() {
        comCorpoInvalido(tokenVeterinario).post("/api/usuarios").then()
                .statusCode(403)
                .body("mensagem", equalTo("Acesso negado"));

        comCorpoInvalido(tokenAgente).post("/api/usuarios").then()
                .statusCode(403)
                .body("mensagem", equalTo("Acesso negado"));

        comCorpoInvalido(tokenAdmin).post("/api/usuarios").then()
                .statusCode(422)
                .body("mensagem", equalTo("Dados invalidos"));
    }

    @Test
    @DisplayName("ocorrencia com corpo invalido: Veterinario (sem acesso a ocorrencias, V11) recebe 403")
    void cadastroDeOcorrencia() {
        comCorpoInvalido(tokenVeterinario).post("/api/ocorrencias").then()
                .statusCode(403)
                .body("mensagem", equalTo("Acesso negado"));

        comCorpoInvalido(tokenAgente).post("/api/ocorrencias").then()
                .statusCode(422)
                .body("mensagem", equalTo("Dados invalidos"));
    }
}
