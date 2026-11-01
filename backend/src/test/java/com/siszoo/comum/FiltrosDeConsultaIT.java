package com.siszoo.comum;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import io.restassured.http.ContentType;

class FiltrosDeConsultaIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAdmin;
    private String tokenAgente;
    private String tokenVet;
    private String marca;

    @BeforeEach
    void preparar() {
        tokenAdmin = fixture.tokenAdmin("admin.filtros.consulta@itu.sp.gov.br", "FiltrosConsulta");
        tokenAgente = fixture.tokenComCargo("agente.filtros.consulta@itu.sp.gov.br", "Agente", "FiltrosConsulta",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        tokenVet = fixture.tokenComCargo("vet.filtros.consulta@itu.sp.gov.br", "Vet", "FiltrosConsulta",
                ApiTesteFixture.CARGO_VETERINARIO_ID);
        marca = marcaUnica();
    }

    @Test
    @DisplayName("animais: busca ignora acento e maiuscula, e acha pela medalha")
    void buscaDeAnimais() {
        String animal = criarAnimal("Xixá " + marca);
        jdbcTemplate.update("UPDATE animal SET numero_medalha = ? WHERE id = ?::uuid", "M-" + marca, animal);
        String outro = criarAnimal("Outro " + marca);

        assertThat(idsDeAnimais("q=" + "xixa " + marca), contains(animal));
        assertThat(idsDeAnimais("q=" + "XIXÁ " + marca), contains(animal));
        assertThat(idsDeAnimais("q=" + "m-" + marca), contains(animal));
        assertThat(idsDeAnimais("q=" + marca), containsInAnyOrder(animal, outro));
    }

    @Test
    @DisplayName("busca: % e _ valem como caracteres comuns")
    void curingasNaoFiltramTudo() {
        String comPorcento = criarAnimal("Lote 100% " + marca);
        String semPorcento = criarAnimal("Lote 1000 " + marca);

        assertThat(idsDeAnimais("q=" + "100% " + marca), contains(comPorcento));
        assertThat(idsDeAnimais("q=" + "1_0 " + marca), empty());
        assertThat(idsDeAnimais("q=" + marca), containsInAnyOrder(comPorcento, semPorcento));
    }

    @Test
    @DisplayName("animais: custodia=true tira adotados e obitos, e combina com a busca")
    void filtroSobCustodia() {
        String noCanil = criarAnimal("Canil " + marca);
        String adotado = criarAnimal("Adotado " + marca);
        jdbcTemplate.update("UPDATE animal SET status_id = (SELECT id FROM status_animal WHERE codigo = 'adotado')"
                + " WHERE id = ?::uuid", adotado);

        assertThat(idsDeAnimais("custodia=true&q=" + marca), contains(noCanil));
        assertThat(idsDeAnimais("q=" + marca), containsInAnyOrder(noCanil, adotado));
    }

    @Test
    @DisplayName("animais: nomes repetidos nao repetem nem somem entre as paginas")
    void paginacaoEstavelComNomesIguais() {
        List<String> criados = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            criados.add(criarAnimal("Igual " + marca));
        }

        List<String> percorridos = new ArrayList<>();
        for (int pagina = 0; pagina < 3; pagina++) {
            percorridos.addAll(given().header("Authorization", "Bearer " + tokenVet)
                    .when().get("/api/animais?q=" + marca + "&tamanho=2&pagina=" + pagina)
                    .then().statusCode(200).extract().path("itens.id"));
        }

        assertThat(percorridos, containsInAnyOrder(criados.toArray()));
    }

    @Test
    @DisplayName("ocorrencias: status aceita varios valores e nao altera os registros")
    void statusAgrupadoDeOcorrencias() {
        String aberta = criarOcorrencia("Rua " + marca, "Centro", false);
        String emAtendimento = criarOcorrencia("Rua " + marca, "Centro", false);
        String encerrada = criarOcorrencia("Rua " + marca, "Centro", false);
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAgente)
                .body(Map.of("status", "EM_ATENDIMENTO"))
                .when().patch("/api/ocorrencias/" + emAtendimento + "/status").then().statusCode(200);
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAgente)
                .body(Map.of("providenciaTomada", "sem_acao"))
                .when().post("/api/ocorrencias/" + encerrada + "/encerramento").then().statusCode(200);

        assertThat(idsDeOcorrencias("status=ABERTA,EM_ATENDIMENTO&q=" + marca), containsInAnyOrder(aberta, emAtendimento));
        assertThat(idsDeOcorrencias("status=ENCERRADA&q=" + marca), contains(encerrada));
        assertThat(idsDeOcorrencias("q=" + marca), containsInAnyOrder(aberta, emAtendimento, encerrada));
        given().header("Authorization", "Bearer " + tokenAgente).when().get("/api/ocorrencias/" + emAtendimento)
                .then().statusCode(200).body("statusOcorrencia", equalTo("EM_ATENDIMENTO"));
    }

    @Test
    @DisplayName("ocorrencias: busca por endereco e bairro sem acento")
    void buscaPorEnderecoEBairro() {
        String ocorrencia = criarOcorrencia("Rua São João " + marca, "Jardim Paraíso " + marca, false);

        assertThat(idsDeOcorrencias("q=" + "sao joao " + marca), contains(ocorrencia));
        assertThat(idsDeOcorrencias("q=" + "jardim paraiso " + marca), contains(ocorrencia));
    }

    @Test
    @DisplayName("ocorrencia e processo se acham pelo protocolo um do outro, e o prefixo escolhe qual")
    void buscaPelosProtocolosVinculados() {
        String ocorrencia = criarOcorrencia("Rua " + marca, "Centro", false);
        String avulsa = criarOcorrencia("Rua " + marca, "Centro", false);
        String processo = fixture.postarProcesso(tokenAdmin, ocorrencia, false).then().statusCode(200).extract().path("id");
        String protocoloProcesso = protocolo("processo_sanitario", processo);
        String protocoloOcorrencia = protocolo("ocorrencia", ocorrencia);

        assertThat(idsDeOcorrencias("q=" + "PS " + protocoloProcesso), contains(ocorrencia));
        assertThat(idsDeOcorrencias("q=" + "PS " + protocolo("ocorrencia", avulsa)), not(hasItem(avulsa)));
        assertThat(idsDeProcessos("q=" + "OC " + protocoloOcorrencia), contains(processo));
        assertThat(idsDeProcessos("q=" + "oc" + protocoloOcorrencia), contains(processo));
    }

    @Test
    @DisplayName("processos: acha pelo animal amostrado, sem acento, e processo sem ocorrencia continua na lista")
    void buscaPorAnimalAmostrado() {
        String animal = criarAnimal("Tóbi " + marca);
        String processo = fixture.postarProcesso(tokenAdmin, null, false).then().statusCode(200).extract().path("id");
        jdbcTemplate.update("UPDATE animal_amostrado SET animal_id = ?::uuid WHERE processo_id = ?::uuid", animal, processo);
        String outro = fixture.postarProcesso(tokenAdmin, null, false).then().statusCode(200).extract().path("id");

        assertThat(idsDeProcessos("q=" + "tobi " + marca), contains(processo));
        assertThat(idsDeProcessos("q=" + protocolo("processo_sanitario", outro)), hasItem(outro));
    }

    @Test
    @DisplayName("processos: status em andamento inclui COM_RESULTADO e tira CONCLUIDO, com periodo de abertura")
    void statusEPeriodoDeProcessos() {
        LocalDate hoje = fixture.hoje();
        String comResultado = criarProcesso(hoje.minusDays(3), "COM_RESULTADO");
        String concluido = criarProcesso(hoje.minusDays(3), "CONCLUIDO");
        String antigo = criarProcesso(hoje.minusDays(40), "ABERTO");

        String periodo = "de=" + hoje.minusDays(10) + "&ate=" + hoje;
        String emAndamento = "status=ABERTO,AGUARDANDO_RESULTADO,COM_RESULTADO";
        List<String> recentes = idsDeProcessos(emAndamento + "&" + periodo + "&tamanho=500");

        assertThat(recentes, hasItem(comResultado));
        assertThat(recentes, not(hasItem(concluido)));
        assertThat(recentes, not(hasItem(antigo)));
        assertThat(idsDeProcessos("de=" + hoje.minusDays(40) + "&ate=" + hoje.minusDays(40) + "&tamanho=500"), hasItem(antigo));
    }

    @Test
    @DisplayName("sigilo: denunciante de ocorrencia sigilosa nao entra na busca, mas o endereco do fato sim")
    void sigiloDoDenunciantePreservado() {
        String sigilosa = criarOcorrenciaComDenunciante("Rua " + marca, true);
        String comum = criarOcorrenciaComDenunciante("Rua " + marca, false);

        assertThat(idsDeOcorrencias("q=" + "Denunciante " + marca), contains(comum));
        assertThat(idsDeOcorrencias("q=" + "Rua " + marca), containsInAnyOrder(sigilosa, comum));
    }

    @Test
    @DisplayName("permissoes: o Veterinario segue sem listar ocorrencias e os novos filtros nao abrem o endpoint")
    void permissoesPreservadas() {
        given().header("Authorization", "Bearer " + tokenVet)
                .when().get("/api/ocorrencias?status=ABERTA,EM_ATENDIMENTO&q=" + marca)
                .then().statusCode(403);
        given().when().get("/api/animais?custodia=true").then().statusCode(401);
        given().when().get("/api/processos?de=2026-01-01").then().statusCode(401);
    }

    private List<String> idsDeAnimais(String query) {
        return given().header("Authorization", "Bearer " + tokenVet).when().get("/api/animais?" + query)
                .then().statusCode(200).extract().path("itens.id");
    }

    private List<String> idsDeOcorrencias(String query) {
        return given().header("Authorization", "Bearer " + tokenAgente).when().get("/api/ocorrencias?" + query)
                .then().statusCode(200).extract().path("itens.id");
    }

    private List<String> idsDeProcessos(String query) {
        return given().header("Authorization", "Bearer " + tokenAgente).when().get("/api/processos?" + query)
                .then().statusCode(200).extract().path("itens.id");
    }

    private String protocolo(String tabela, String id) {
        return jdbcTemplate.queryForObject("SELECT protocolo FROM " + tabela + " WHERE id = ?::uuid", String.class, id);
    }

    private String criarAnimal(String nome) {
        String id = fixture.criarAnimal(tokenVet);
        jdbcTemplate.update("UPDATE animal SET nome = ? WHERE id = ?::uuid", nome, id);
        return id;
    }

    private String criarProcesso(LocalDate dataAbertura, String status) {
        String id = fixture.postarProcesso(tokenAdmin, null, false).then().statusCode(200).extract().path("id");
        jdbcTemplate.update("UPDATE processo_sanitario SET data_abertura = ?, status_processo = ? WHERE id = ?::uuid",
                dataAbertura, status, id);
        return id;
    }

    private String criarOcorrencia(String endereco, String bairro, boolean sigilosa) {
        Map<String, Object> corpo = corpoOcorrencia(endereco, bairro, sigilosa);
        corpo.put("anonima", true);
        return postarOcorrencia(corpo);
    }

    private String criarOcorrenciaComDenunciante(String endereco, boolean sigilosa) {
        Map<String, Object> corpo = corpoOcorrencia(endereco, "Centro", sigilosa);
        corpo.put("anonima", false);
        Map<String, Object> denunciante = new HashMap<>();
        denunciante.put("nome", "Denunciante " + marca);
        corpo.put("denunciante", denunciante);
        return postarOcorrencia(corpo);
    }

    private Map<String, Object> corpoOcorrencia(String endereco, String bairro, boolean sigilosa) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "irregular");
        corpo.put("dataAbertura", fixture.hoje().toString());
        corpo.put("horaAbertura", "09:00");
        corpo.put("endereco", endereco);
        corpo.put("bairro", bairro);
        corpo.put("descricao", "Ocorrencia de teste dos filtros de consulta");
        corpo.put("urgente", false);
        corpo.put("sigilosa", sigilosa);
        return corpo;
    }

    private String postarOcorrencia(Map<String, Object> corpo) {
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + tokenAgente)
                .body(corpo).when().post("/api/ocorrencias").then().statusCode(200).extract().path("id");
    }


    private static String marcaUnica() {
        StringBuilder marca = new StringBuilder("zq");
        long valor = System.nanoTime();
        for (int i = 0; i < 10; i++) {
            marca.append((char) ('a' + valor % 26));
            valor /= 26;
        }
        return marca.toString();
    }
}
