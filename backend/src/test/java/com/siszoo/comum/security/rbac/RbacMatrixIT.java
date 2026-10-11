package com.siszoo.comum.security.rbac;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// T13: prova por HTTP real (token JWT emitido pelo login de produção, nunca fabricado
// manualmente) que cada perfil só acessa os endpoints permitidos pela matriz de cargos
// semeada em V3__seed_cargos.sql. Cada caso-âncora afirma tanto o 200 do perfil
// autorizado quanto o 403 dos demais.
@Import({
        ScaffoldCriarUsuarioController.class,
        ScaffoldListarUsuariosController.class
})
class RbacMatrixIT extends AbstractIntegrationTest {

    private static final String ROTA_USUARIOS = "/api/teste/rbac/usuarios";
    private static final String ROTA_ANIMAIS = "/api/animais";
    private static final String ROTA_OCORRENCIAS = "/api/ocorrencias";
    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01};

    @Autowired
    private ApiTesteFixture fixture;

    private enum Perfil {
        ADMINISTRADOR("00000000-0000-4000-8000-000000000001", "administrador.rbac@itu.sp.gov.br"),
        VETERINARIO("00000000-0000-4000-8000-000000000002", "veterinario.rbac@itu.sp.gov.br"),
        AGENTE_SANITARIO("00000000-0000-4000-8000-000000000003", "agente.rbac@itu.sp.gov.br");

        private final UUID cargoId;
        private final String email;

        Perfil(String cargoId, String email) {
            this.cargoId = UUID.fromString(cargoId);
            this.email = email;
        }
    }

    static Stream<Arguments> criarUsuarioPorPerfil() {
        return Stream.of(
                Arguments.of(Perfil.ADMINISTRADOR, 200),
                Arguments.of(Perfil.VETERINARIO, 403),
                Arguments.of(Perfil.AGENTE_SANITARIO, 403));
    }

    static Stream<Arguments> listarUsuariosPorPerfil() {
        return Stream.of(
                Arguments.of(Perfil.ADMINISTRADOR, 200),
                Arguments.of(Perfil.VETERINARIO, 403),
                Arguments.of(Perfil.AGENTE_SANITARIO, 403));
    }

    static Stream<Arguments> escreverAnimalPorPerfil() {
        return Stream.of(
                Arguments.of(Perfil.ADMINISTRADOR, 200),
                Arguments.of(Perfil.VETERINARIO, 200),
                Arguments.of(Perfil.AGENTE_SANITARIO, 403));
    }

    // T25 (V3 + V10): ocorrencias RW para Admin e Agente, R para o Vet; a
    // feature denunciante_sigiloso (Admin e Agente) libera o denunciante e os
    // anexos de ocorrencia sigilosa; vincular processo exige escrita em ocorrencias.
    static Stream<Arguments> escreverOcorrenciaPorPerfil() {
        return Stream.of(
                Arguments.of(Perfil.ADMINISTRADOR, 200),
                Arguments.of(Perfil.VETERINARIO, 403),
                Arguments.of(Perfil.AGENTE_SANITARIO, 200));
    }

    static Stream<Arguments> verDenuncianteSigilosoPorPerfil() {
        return Stream.of(
                Arguments.of(Perfil.ADMINISTRADOR, true),
                Arguments.of(Perfil.VETERINARIO, false),
                Arguments.of(Perfil.AGENTE_SANITARIO, true));
    }

    static Stream<Arguments> baixarAnexoSigilosoPorPerfil() {
        return Stream.of(
                Arguments.of(Perfil.ADMINISTRADOR, 200),
                Arguments.of(Perfil.VETERINARIO, 403),
                Arguments.of(Perfil.AGENTE_SANITARIO, 200));
    }

    static Stream<Arguments> vincularProcessoPorPerfil() {
        return Stream.of(
                Arguments.of(Perfil.ADMINISTRADOR, 200),
                Arguments.of(Perfil.VETERINARIO, 403),
                Arguments.of(Perfil.AGENTE_SANITARIO, 200));
    }

    @ParameterizedTest(name = "{0} ao criar usuário -> status {1}")
    @MethodSource("criarUsuarioPorPerfil")
    void somenteAdminCriaUsuario(Perfil perfil, int statusEsperado) {
        given()
                .header("Authorization", "Bearer " + tokenPara(perfil))
                .when()
                .post(ROTA_USUARIOS)
                .then()
                .statusCode(statusEsperado);
    }

    @ParameterizedTest(name = "{0} ao listar usuários -> status {1}")
    @MethodSource("listarUsuariosPorPerfil")
    void veterinarioNaoAcessaUsuarios(Perfil perfil, int statusEsperado) {
        given()
                .header("Authorization", "Bearer " + tokenPara(perfil))
                .when()
                .get(ROTA_USUARIOS)
                .then()
                .statusCode(statusEsperado);
    }

    @ParameterizedTest(name = "{0} ao escrever animal -> status {1}")
    @MethodSource("escreverAnimalPorPerfil")
    void agenteSanitarioNaoEscreveAnimais(Perfil perfil, int statusEsperado) {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenPara(perfil))
                .body(animalValidoParaTeste())
                .when()
                .post(ROTA_ANIMAIS)
                .then()
                .statusCode(statusEsperado);
    }

    @ParameterizedTest(name = "{0} ao criar ocorrencia -> status {1}")
    @MethodSource("escreverOcorrenciaPorPerfil")
    void veterinarioNaoEscreveOcorrencias(Perfil perfil, int statusEsperado) {
        criarOcorrencia(tokenPara(perfil), false).then().statusCode(statusEsperado);
    }

    @ParameterizedTest(name = "{0} ve o denunciante de ocorrencia sigilosa -> {1}")
    @MethodSource("verDenuncianteSigilosoPorPerfil")
    void denuncianteSigilosoSoComAFeature(Perfil perfil, boolean ve) {
        String id = criarOcorrencia(tokenPara(Perfil.AGENTE_SANITARIO), true).then().statusCode(200).extract().path("id");

        Object nome = given().header("Authorization", "Bearer " + tokenPara(perfil))
                .when().get(ROTA_OCORRENCIAS + "/" + id).then().statusCode(200).extract().path("denunciante.nome");

        assertThat(nome, ve ? equalTo("Denunciante Rbac") : nullValue());
    }

    @ParameterizedTest(name = "{0} ao baixar anexo de ocorrencia sigilosa -> status {1}")
    @MethodSource("baixarAnexoSigilosoPorPerfil")
    void anexoSigilosoSoComAFeature(Perfil perfil, int statusEsperado) {
        String tokenAgente = tokenPara(Perfil.AGENTE_SANITARIO);
        String id = criarOcorrencia(tokenAgente, true).then().statusCode(200).extract().path("id");
        String anexoId = given().header("Authorization", "Bearer " + tokenAgente)
                .multiPart("arquivo", "foto.png", PNG, "image/png")
                .when().post(ROTA_OCORRENCIAS + "/" + id + "/anexos").then().statusCode(200).extract().path("id");

        given().header("Authorization", "Bearer " + tokenPara(perfil))
                .when().get(ROTA_OCORRENCIAS + "/" + id + "/anexos/" + anexoId)
                .then().statusCode(statusEsperado);
    }

    @ParameterizedTest(name = "{0} ao criar processo vinculado a ocorrencia -> status {1}")
    @MethodSource("vincularProcessoPorPerfil")
    void vinculoExigeEscritaEmOcorrencias(Perfil perfil, int statusEsperado) {
        String id = criarOcorrencia(tokenPara(Perfil.AGENTE_SANITARIO), false).then().statusCode(200).extract().path("id");
        Map<String, Object> processo = new HashMap<>();
        processo.put("dataAbertura", fixture.hoje().toString());
        processo.put("ocorrenciaId", id);

        given().header("Authorization", "Bearer " + tokenPara(perfil))
                .contentType(ContentType.JSON).body(processo)
                .when().post("/api/processos")
                .then().statusCode(statusEsperado);
    }

    private Response criarOcorrencia(String token, boolean sigilosa) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "zoonose");
        corpo.put("dataAbertura", fixture.hoje().toString());
        corpo.put("endereco", "Rua Rbac, 1");
        corpo.put("bairro", "Centro");
        corpo.put("descricao", "Ocorrencia da matriz RBAC");
        corpo.put("sigilosa", sigilosa);
        corpo.put("denunciante", Map.of("nome", "Denunciante Rbac"));
        return given().header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON).body(corpo)
                .when().post(ROTA_OCORRENCIAS);
    }

    private CriarAnimalRequest animalValidoParaTeste() {
        return new CriarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null, null,
                false, null, "disponivel_adocao", "resgate", fixture.agora(), null, null, null);
    }

    private String tokenPara(Perfil perfil) {
        return fixture.tokenComCargo(perfil.email, "Teste", "Rbac", perfil.cargoId);
    }
}
