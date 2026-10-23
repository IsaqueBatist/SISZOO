package com.siszoo.usuarios;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.animais.dto.CriarBaiaRequest;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// F2-027 (Fase 3 do TG): filtros de servidor em GET /api/auditoria (acao,
// entidade, usuarioEmail, modulo, de/ate), payload antes/depois no DTO e o
// catalogo GET /api/auditoria/filtros. Contrato: docs/contratos/auditoria-filtros.md.
class AuditoriaFiltrosIT extends AbstractIntegrationTest {

    private static final String EMAIL_ADMIN = "teste.admin.filtros.auditoria@itu.sp.gov.br";

    @Autowired
    private ApiTesteFixture fixture;

    private String tokenAdmin;
    private String baiaId;

    @BeforeEach
    void preparar() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Filtros");
        // Um evento CRIACAO de baia deste admin, para filtrar por acao/entidade/usuario/modulo.
        baiaId = given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarBaiaRequest("Baia Filtro " + System.nanoTime() % 100000, "interna", (short) 3, null, null))
                .when().post("/api/baias").then().statusCode(200).extract().path("id");
    }

    @Test
    @DisplayName("[F2-027] sem parametros: comportamento anterior (paginado, mais recente primeiro)")
    void semParametrosPagina() {
        Response r = listar("");
        r.then().statusCode(200);
        assertThat(r.path("itens.size()"), greaterThanOrEqualTo(1));
        assertThat(r.path("totalItens"), notNullValue());
    }

    @Test
    @DisplayName("[F2-027] filtro por acao + entidade + usuarioEmail devolve so os eventos correspondentes, com payload")
    void filtraPorAcaoEntidadeUsuario() {
        Response r = listar("?acao=CRIACAO&entidade=baia&usuarioEmail=" + EMAIL_ADMIN);

        r.then().statusCode(200);
        List<String> acoes = r.path("itens.acao");
        List<String> entidades = r.path("itens.entidade");
        List<String> usuarios = r.path("itens.usuarioEmail");
        assertThat(acoes.size(), greaterThanOrEqualTo(1));
        assertThat(acoes, everyItem(equalTo("CRIACAO")));
        assertThat(entidades, everyItem(equalTo("baia")));
        assertThat(usuarios, everyItem(equalTo(EMAIL_ADMIN)));
        List<String> ids = r.path("itens.entidadeId");
        assertThat(ids, hasItem(baiaId));
        // payload antes/depois expostos (pedido adicional do contrato)
        List<Map<String, Object>> itens = r.path("itens");
        Map<String, Object> evento = itens.stream().filter(i -> baiaId.equals(i.get("entidadeId"))).findFirst().orElseThrow();
        assertThat(evento.get("payloadAntes"), equalTo(null));
        assertThat((String) evento.get("payloadDepois"), containsString("\"capacidade\""));
    }

    @Test
    @DisplayName("[F2-027] filtro por modulo usa o mapa entidade -> modulo (baia e GESTAO_ANIMAIS; usuario nao)")
    void filtraPorModulo() {
        Response animais = listar("?modulo=GESTAO_ANIMAIS&tamanho=50");
        animais.then().statusCode(200);
        List<String> entidades = animais.path("itens.entidade");
        assertThat(entidades, hasItem("baia"));
        assertThat(entidades, not(hasItem("usuario")));

        Response usuarios = listar("?modulo=USUARIOS_ACESSO&tamanho=50");
        usuarios.then().statusCode(200);
        List<String> entidadesUsuarios = usuarios.path("itens.entidade");
        assertThat(entidadesUsuarios, everyItem(equalTo("usuario")));
    }

    @Test
    @DisplayName("[F2-027] filtro por periodo: hoje devolve eventos; periodo passado devolve vazio")
    void filtraPorPeriodo() {
        String hoje = LocalDate.now().toString();
        Response r = listar("?de=" + hoje + "&ate=" + hoje + "&entidade=baia");
        r.then().statusCode(200);
        assertThat(r.path("itens.size()"), greaterThanOrEqualTo(1));

        Response vazio = listar("?de=2000-01-01&ate=2000-01-31");
        vazio.then().statusCode(200).body("totalItens", equalTo(0));
    }

    @Test
    @DisplayName("[F2-027] GET /api/auditoria/filtros devolve acoes, entidades, usuarios e os 5 modulos")
    void catalogoDeFiltros() {
        Response r = given().header("Authorization", "Bearer " + tokenAdmin).when().get("/api/auditoria/filtros");
        r.then().statusCode(200);
        assertThat(r.path("acoes"), hasItems("CRIACAO", "LOGIN"));
        assertThat(r.path("entidades"), hasItems("baia", "usuario"));
        assertThat(r.path("usuarios"), hasItem(EMAIL_ADMIN));
        assertThat(r.path("modulos"), hasItems("USUARIOS_ACESSO", "GESTAO_ANIMAIS", "OCORRENCIAS_DENUNCIAS",
                "PROCESSOS_SANITARIOS", "RELATORIOS"));
    }

    @Test
    @DisplayName("[F2-027] filtros continuam exclusivos do Administrador (USUARIOS_ACESSO:leitura)")
    void filtrosExigemAdmin() {
        String tokenVet = fixture.tokenComCargo("teste.vet.filtros@itu.sp.gov.br", "Vet", "Filtros",
                ApiTesteFixture.CARGO_VETERINARIO_ID);
        given().header("Authorization", "Bearer " + tokenVet).when().get("/api/auditoria?acao=LOGIN").then().statusCode(403);
        given().header("Authorization", "Bearer " + tokenVet).when().get("/api/auditoria/filtros").then().statusCode(403);
    }

    private Response listar(String query) {
        return given().header("Authorization", "Bearer " + tokenAdmin).when().get("/api/auditoria" + query);
    }
}
