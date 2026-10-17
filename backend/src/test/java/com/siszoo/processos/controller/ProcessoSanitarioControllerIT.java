package com.siszoo.processos.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// Processo sanitario completo (T29) pela API: criacao com responsavel e
// amostras, as duas modalidades de amostra, independencia da ficha, urgencia
// derivada, vinculo imutavel, catalogos, rollback e auditoria sem dado pessoal.
@Import(RelogioTesteConfig.class)
class ProcessoSanitarioControllerIT extends AbstractIntegrationTest {

    private static final String ROTA = "/api/processos";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAdmin;
    private String tokenAgente;
    private String tokenVet;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin("admin.processos@itu.sp.gov.br", "Processos");
        tokenAgente = fixture.tokenComCargo("agente.processos@itu.sp.gov.br", "Agente", "Processos",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        tokenVet = fixture.tokenComCargo("vet.processos@itu.sp.gov.br", "Vet", "Processos",
                ApiTesteFixture.CARGO_VETERINARIO_ID);
    }

    // ── Criacao e consulta ───────────────────────────────

    @Test
    @DisplayName("[T29] cria processo completo: protocolo, catalogos, CID, responsavel e amostra de campo; GET devolve o mesmo")
    void criaProcessoCompleto() {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        corpo.put("observacoes", "Suspeita de raiva");
        corpo.put("responsavel", responsavelCompleto());

        Response resposta = fixture.postarProcesso(tokenVet, corpo);

        resposta.then().statusCode(200);
        assertThat(resposta.path("protocolo"), matchesPattern("\\d{3,}/2026"));
        assertThat(resposta.path("statusProcesso"), equalTo("ABERTO"));
        assertThat(resposta.path("urgente"), equalTo(false));
        assertThat(resposta.path("ocorrenciaId"), nullValue());
        assertThat(resposta.path("doenca.codigo"), equalTo("raiva"));
        assertThat(resposta.path("cid"), equalTo("A82"));
        assertThat(resposta.path("laboratorio.codigo"), equalTo("pasteur_sp"));
        assertThat(resposta.path("observacoes"), equalTo("Suspeita de raiva"));
        assertThat(resposta.path("responsavel.nome"), equalTo("Maria Responsavel"));
        assertThat(resposta.path("responsavel.bairroOcorrencia"), equalTo("Vila Nova"));
        assertThat(resposta.path("amostras"), hasSize(1));
        assertThat(resposta.path("amostras[0].animalId"), nullValue());
        assertThat(resposta.path("amostras[0].especie.codigo"), equalTo("canino"));
        assertThat(resposta.path("amostras[0].sexo"), equalTo("macho"));
        assertThat(resposta.path("amostras[0].statusClinico"), equalTo("ASSINTOMATICO"));
        assertThat(resposta.path("amostras[0].materialBiologico"), equalTo("SORO"));
        assertThat(resposta.path("amostras[0].dataColeta"), equalTo(RelogioTesteConfig.HOJE.toString()));

        Response detalhe = buscar(tokenAgente, resposta.path("id"));
        detalhe.then().statusCode(200);
        assertThat(detalhe.path("protocolo"), equalTo(resposta.path("protocolo")));
        assertThat(detalhe.path("responsavel.nome"), equalTo("Maria Responsavel"));
        assertThat(detalhe.path("responsavel.cpf"), equalTo("123.456.789-00"));
        assertThat(detalhe.path("responsavel.email"), equalTo("maria@exemplo.com"));
        assertThat(detalhe.path("amostras"), hasSize(1));
        assertThat(detalhe.path("amostras[0].id"), equalTo(resposta.path("amostras[0].id")));
        assertThat(detalhe.path("amostras[0].tipoAbrigo"), equalTo("PERIDOMICILIAR"));
    }

    @Test
    @DisplayName("[T29] 422 sem responsavel, sem amostras, com catalogo invalido ou dado de amostra invalido")
    void recusaProcessoIncompletoOuInvalido() {
        int processosAntes = contar("processo_sanitario");

        Map<String, Object> semResponsavel = fixture.corpoProcesso(null, false);
        semResponsavel.remove("responsavel");
        Map<String, Object> responsavelEmBranco = fixture.corpoProcesso(null, false);
        responsavelEmBranco.put("responsavel", Map.of("nome", "  "));
        Map<String, Object> semAmostras = fixture.corpoProcesso(null, false);
        semAmostras.remove("amostras");
        Map<String, Object> amostrasVazias = fixture.corpoProcesso(null, false);
        amostrasVazias.put("amostras", List.of());
        Map<String, Object> doencaInvalida = fixture.corpoProcesso(null, false);
        doencaInvalida.put("doenca", "gripe");
        Map<String, Object> laboratorioInvalido = fixture.corpoProcesso(null, false);
        laboratorioInvalido.put("laboratorio", "lab_x");
        Map<String, Object> especieInvalida = comAmostra(Map.of("especie", "dinossauro"));
        Map<String, Object> sexoInvalido = comAmostra(Map.of("sexo", "MACHO"));
        Map<String, Object> sintomaInvalido = comAmostra(Map.of("statusClinico", "SINTOMATICO", "sintomas", List.of("tosse")));
        Map<String, Object> coletaFutura = comAmostra(Map.of("dataColeta", RelogioTesteConfig.HOJE.plusDays(1).toString()));

        for (Map<String, Object> corpo : List.of(semResponsavel, responsavelEmBranco, semAmostras, amostrasVazias,
                doencaInvalida, laboratorioInvalido, especieInvalida, sexoInvalido, sintomaInvalido, coletaFutura)) {
            fixture.postarProcesso(tokenAgente, corpo).then().statusCode(422);
        }
        assertThat(contar("processo_sanitario"), equalTo(processosAntes));
    }

    @Test
    @DisplayName("[T29] data de coleta comparada com o Clock do projeto: amanha 422 com mensagem; hoje aceita")
    void dataColetaFuturaRecusada() {
        int processosAntes = contar("processo_sanitario");

        Response futura = fixture.postarProcesso(tokenAgente,
                comAmostra(Map.of("dataColeta", RelogioTesteConfig.HOJE.plusDays(1).toString())));

        futura.then().statusCode(422);
        assertThat(futura.path("mensagem"), equalTo("Data de coleta nao pode ser futura"));
        assertThat(contar("processo_sanitario"), equalTo(processosAntes));
        fixture.postarProcesso(tokenAgente, comAmostra(Map.of("dataColeta", RelogioTesteConfig.HOJE.toString())))
                .then().statusCode(200);
    }

    @Test
    @DisplayName("[T29] sintomas so em amostra SINTOMATICO: aceitos e devolvidos; em ASSINTOMATICO 422 sem gravar nada")
    void sintomasSoEmAmostraSintomatica() {
        Response sintomatica = fixture.postarProcesso(tokenAgente,
                comAmostra(Map.of("statusClinico", "SINTOMATICO", "sintomas", List.of("apatia", "coriza", "apatia"))));

        sintomatica.then().statusCode(200);
        assertThat(sintomatica.path("amostras[0].sintomas.codigo"), containsInAnyOrder("apatia", "coriza"));

        int processosAntes = contar("processo_sanitario");
        Response assintomatica = fixture.postarProcesso(tokenAgente,
                comAmostra(Map.of("statusClinico", "ASSINTOMATICO", "sintomas", List.of("apatia"))));
        assintomatica.then().statusCode(422);
        assertThat(assintomatica.path("mensagem"), containsString("sintomatico"));
        assertThat(contar("processo_sanitario"), equalTo(processosAntes));
    }

    @Test
    @DisplayName("[T29] contato humano: nivel e agressao obrigatorios com contato e proibidos sem ele (422)")
    void contatoHumanoConsistente() {
        fixture.postarProcesso(tokenAgente, comAmostra(Map.of("contatoHumano", true))).then().statusCode(422);
        fixture.postarProcesso(tokenAgente, comAmostra(Map.of("nivelContato", "INDIRETA"))).then().statusCode(422);
        fixture.postarProcesso(tokenAgente,
                comAmostra(Map.of("contatoHumano", true, "nivelContato", "INDIRETA", "agrediuHumano", true)))
                .then().statusCode(200);
    }

    // ── Animal do canil: snapshot e independencia da ficha ──

    @Test
    @DisplayName("[DH-5] amostra do canil copia a identificacao da ficha; alterar a ficha depois nao muda a amostra")
    void amostraDoCanilEhSnapshotIndependente() {
        String microchip = fixture.microchipUnico();
        String animalId = criarAnimal(microchip, "Rex", "felino", "femea", "SRD", "Rajado", "curta", "4.20", "2 anos");

        Response criado = fixture.postarProcesso(tokenAgente, comAmostraDoCanil(animalId, Map.of(
                "statusClinico", "SINTOMATICO", "sintomas", List.of("apatia"),
                "materialBiologico", "SANGUE", "tipoAbrigo", "INTRADOMICILIAR",
                "alteracaoComportamental", "Agitado", "observacoes", "Coleta no canil")));

        criado.then().statusCode(200);
        String processoId = criado.path("id");
        assertThat(criado.path("amostras[0].animalId"), equalTo(animalId));
        assertSnapshot(criado, "felino", "femea", "SRD", "Rajado", "curta", 4.2f, "2 anos");

        // A ficha muda (identificacao e observacoes); a amostra continua igual.
        given().header("Authorization", "Bearer " + tokenAdmin).contentType(ContentType.JSON)
                .body(new AtualizarAnimalRequest("Rex", "canino", "macho", "Labrador", "Preto", "longa", null,
                        new BigDecimal("9.90"), "5 anos", null, microchip, false, null, "em_tratamento", "resgate",
                        fixture.agora(), null, null, "Ficha alterada"))
                .when().put("/api/animais/" + animalId)
                .then().statusCode(200);

        Response depois = buscar(tokenAgente, processoId);
        assertSnapshot(depois, "felino", "femea", "SRD", "Rajado", "curta", 4.2f, "2 anos");
        assertThat(depois.path("amostras[0].statusClinico"), equalTo("SINTOMATICO"));
        assertThat(depois.path("amostras[0].materialBiologico"), equalTo("SANGUE"));
        assertThat(depois.path("amostras[0].alteracaoComportamental"), equalTo("Agitado"));
        assertThat(depois.path("amostras[0].observacoes"), equalTo("Coleta no canil"));
        assertThat(depois.path("amostras[0].sintomas.codigo"), containsInAnyOrder("apatia"));
    }

    @Test
    @DisplayName("[DH-5] animalId com campo de identificacao: 422; animalId inexistente: 404")
    void amostraDoCanilRecusaIdentificacaoEAnimalInexistente() {
        String animalId = fixture.criarAnimal(tokenAdmin);

        Response comIdentificacao = fixture.postarProcesso(tokenAgente, comAmostraDoCanil(animalId, Map.of("raca", "SRD")));
        comIdentificacao.then().statusCode(422);
        assertThat(comIdentificacao.path("mensagem"), containsString("ficha"));

        fixture.postarProcesso(tokenAgente, comAmostraDoCanil(UUID.randomUUID().toString(), Map.of()))
                .then().statusCode(404);
    }

    @Test
    @DisplayName("[T29] animal de qualquer status pode ser amostrado (ponto a confirmar com o CCZ)")
    void animalDeQualquerStatusPodeSerAmostrado() {
        for (String status : List.of("adotado", "obito_natural", "transferido")) {
            String animalId = fixture.criarAnimal(tokenAdmin, status);
            fixture.postarProcesso(tokenAgente, comAmostraDoCanil(animalId, Map.of())).then().statusCode(200);
        }
    }

    // ── Urgencia, CID e vinculo ──────────────────────────

    @Test
    @DisplayName("[DER 18] contato humano em qualquer amostra torna o processo e a ocorrencia vinculada urgentes")
    void urgenciaDerivadaDasAmostras() {
        String ocorrenciaId = criarOcorrencia();
        Map<String, Object> corpo = fixture.corpoProcesso(ocorrenciaId, false);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> amostras = (List<Map<String, Object>>) corpo.get("amostras");
        amostras.add(new HashMap<>(Map.of("especie", "felino", "sexo", "femea", "statusClinico", "OBITO",
                "tipoAbrigo", "SILVESTRE", "dataColeta", RelogioTesteConfig.HOJE.toString(),
                "materialBiologico", "TECIDO_ENCEFALICO", "contatoHumano", true,
                "nivelContato", "DIRETA", "agrediuHumano", true)));

        Response resposta = fixture.postarProcesso(tokenAgente, corpo);

        resposta.then().statusCode(200);
        assertThat(resposta.path("urgente"), equalTo(true));
        assertThat(resposta.path("amostras"), hasSize(2));
        assertThat(resposta.path("ocorrenciaId"), equalTo(ocorrenciaId));
        Response ocorrencia = given().header("Authorization", "Bearer " + tokenAgente)
                .when().get("/api/ocorrencias/" + ocorrenciaId);
        assertThat(ocorrencia.path("urgente"), equalTo(true));
        assertThat(ocorrencia.path("processoVinculado.id"), equalTo(resposta.path("id")));

        fixture.postarProcesso(tokenAgente, fixture.corpoProcesso(null, false)).then().statusCode(200);
        assertThat(fixture.postarProcesso(tokenAgente, fixture.corpoProcesso(null, false)).path("urgente"), equalTo(false));
    }

    @Test
    @DisplayName("[T29] cid e snapshot de doenca.cid: mudar o catalogo depois nao altera o processo")
    void cidEhSnapshotDaDoenca() {
        String processoId = fixture.postarProcesso(tokenAgente, null, false).then().statusCode(200)
                .extract().path("id");
        try {
            jdbcTemplate.update("UPDATE doenca SET cid = 'X99' WHERE codigo = 'raiva'");

            assertThat(buscar(tokenAgente, processoId).path("cid"), equalTo("A82"));
            assertThat(fixture.postarProcesso(tokenAgente, null, false).path("cid"), equalTo("X99"));
        } finally {
            jdbcTemplate.update("UPDATE doenca SET cid = 'A82' WHERE codigo = 'raiva'");
        }
    }

    @Test
    @DisplayName("[DER 15] vinculo imutavel: processo ja vinculado nao aceita outra ocorrencia (409) e o banco recusa a troca")
    void vinculoImutavel() {
        String ocorrenciaId = criarOcorrencia();
        String outraOcorrencia = criarOcorrencia();
        String processoId = fixture.postarProcesso(tokenAgente, ocorrenciaId, false).then().statusCode(200)
                .extract().path("id");

        given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                .body(Map.of("processoId", processoId))
                .when().post("/api/ocorrencias/" + outraOcorrencia + "/processo")
                .then().statusCode(409);

        // Ultima barreira, para qualquer caminho fora do service (trigger da V13).
        assertThrows(DataIntegrityViolationException.class, () -> jdbcTemplate.update(
                "UPDATE processo_sanitario SET ocorrencia_id = CAST(? AS uuid) WHERE id = CAST(? AS uuid)",
                outraOcorrencia, processoId));
        assertThrows(DataIntegrityViolationException.class, () -> jdbcTemplate.update(
                "UPDATE processo_sanitario SET ocorrencia_id = NULL WHERE id = CAST(? AS uuid)", processoId));
        assertThat(buscar(tokenAgente, processoId).path("ocorrenciaId"), equalTo(ocorrenciaId));

        // Avancar o status grava a linha inteira (com o mesmo vinculo) e continua permitido.
        given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                .body(Map.of("status", "AGUARDANDO_RESULTADO"))
                .when().patch(ROTA + "/" + processoId + "/status")
                .then().statusCode(200);
    }

    @Test
    @DisplayName("[Emenda 2026-10-03] processo criado sem vinculo pode ser vinculado depois, uma unica vez")
    void vinculoPosteriorUmaVez() {
        String processoId = fixture.postarProcesso(tokenAgente, null, false).then().statusCode(200)
                .extract().path("id");
        String ocorrenciaId = criarOcorrencia();

        given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                .body(Map.of("processoId", processoId))
                .when().post("/api/ocorrencias/" + ocorrenciaId + "/processo")
                .then().statusCode(200);

        assertThat(buscar(tokenAgente, processoId).path("ocorrenciaId"), equalTo(ocorrenciaId));
    }

    // ── Transacao e auditoria ────────────────────────────

    @Test
    @DisplayName("[T29] falha na segunda amostra desfaz tudo: sem processo, responsavel, amostra nem protocolo consumido")
    void falhaNaSegundaAmostraDesfazTudo() {
        int ano = RelogioTesteConfig.HOJE.getYear();
        fixture.postarProcesso(tokenAgente, null, false).then().statusCode(200);
        Integer protocoloAntes = ultimoProtocolo(ano);
        int processos = contar("processo_sanitario");
        int responsaveis = contar("responsavel_processo");
        int amostras = contar("animal_amostrado");

        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> lista = (List<Map<String, Object>>) corpo.get("amostras");
        lista.add(amostraDoCanil(UUID.randomUUID().toString(), Map.of()));

        fixture.postarProcesso(tokenAgente, corpo).then().statusCode(404);

        assertThat(ultimoProtocolo(ano), equalTo(protocoloAntes));
        assertThat(contar("processo_sanitario"), equalTo(processos));
        assertThat(contar("responsavel_processo"), equalTo(responsaveis));
        assertThat(contar("animal_amostrado"), equalTo(amostras));
    }

    @Test
    @DisplayName("[T29/D23] auditoria CRIACAO do processo sem nenhum dado pessoal do responsavel")
    void auditoriaSemDadoPessoalDoResponsavel() {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        corpo.put("responsavel", responsavelCompleto());
        String processoId = fixture.postarProcesso(tokenAgente, corpo).then().statusCode(200).extract().path("id");

        List<String> eventos = jdbcTemplate.queryForList(
                "SELECT CAST(payload_depois AS text) FROM auditoria_evento"
                        + " WHERE entidade = 'processo_sanitario' AND acao = 'CRIACAO' AND entidade_id = CAST(? AS uuid)",
                String.class, processoId);

        assertThat(eventos, hasSize(1));
        String payload = eventos.get(0);
        assertThat(payload, containsString("\"protocolo\""));
        assertThat(payload, containsString("\"amostras\""));
        for (String pessoal : List.of("responsavel", "Maria Responsavel", "123.456.789-00", "(11) 99999-0000",
                "maria@exemplo.com", "13300-000", "Rua das Flores", "Centro", "Vila Nova")) {
            assertThat(payload, payload, not(containsString(pessoal)));
        }
    }

    // ── Listagem ─────────────────────────────────────────

    @Test
    @DisplayName("[T29] listagem paginada com filtros de doenca e status e protocolo da ocorrencia vinculada")
    void listagemComFiltros() {
        given().when().get(ROTA).then().statusCode(401);
        String ocorrenciaId = criarOcorrencia();
        Response vinculado = fixture.postarProcesso(tokenAgente, ocorrenciaId, false);
        String vinculadoId = vinculado.then().statusCode(200).extract().path("id");
        Map<String, Object> esporotricose = fixture.corpoProcesso(null, false);
        esporotricose.put("doenca", "esporotricose");
        String esporotricoseId = fixture.postarProcesso(tokenAgente, esporotricose).then().statusCode(200)
                .extract().path("id");
        given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                .body(Map.of("status", "AGUARDANDO_RESULTADO"))
                .when().patch(ROTA + "/" + esporotricoseId + "/status").then().statusCode(200);

        // O detalhe traz o protocolo da ocorrencia, sem precisar busca-la.
        String protocoloOcorrencia = given().header("Authorization", "Bearer " + tokenAgente)
                .when().get("/api/ocorrencias/" + ocorrenciaId).path("protocolo");
        assertThat(vinculado.path("ocorrenciaProtocolo"), equalTo(protocoloOcorrencia));
        assertThat(buscar(tokenVet, vinculadoId).path("ocorrenciaProtocolo"), equalTo(protocoloOcorrencia));

        Response pagina = listar(tokenVet, "?tamanho=200");
        pagina.then().statusCode(200);
        Map<String, Object> linha = linhaDe(pagina, vinculadoId);
        assertThat(linha.get("protocolo"), equalTo(vinculado.path("protocolo")));
        assertThat(linha.get("ocorrenciaId"), equalTo(ocorrenciaId));
        assertThat(linha.get("ocorrenciaProtocolo"), equalTo(protocoloOcorrencia));
        assertThat(linha.get("statusProcesso"), equalTo("ABERTO"));
        assertThat(((Map<?, ?>) linha.get("doenca")).get("codigo"), equalTo("raiva"));
        // Sem nenhum dado do responsavel (CPF, telefone, e-mail, endereco):
        // a linha tem exatamente estes campos.
        assertThat(linha.keySet(), containsInAnyOrder("id", "protocolo", "dataAbertura", "doenca", "statusProcesso",
                "urgente", "ocorrenciaId", "ocorrenciaProtocolo"));
        assertThat(pagina.asString(), not(containsString("Responsavel Teste")));

        List<String> soEsporotricose = listar(tokenAgente, "?doenca=esporotricose&tamanho=200").path("itens.doenca.codigo");
        assertThat(soEsporotricose.isEmpty(), equalTo(false));
        assertThat(soEsporotricose.stream().allMatch("esporotricose"::equals), equalTo(true));
        List<String> aguardando = listar(tokenAgente, "?status=AGUARDANDO_RESULTADO&tamanho=200").path("itens.id");
        assertThat(aguardando.contains(esporotricoseId), equalTo(true));
        assertThat(aguardando.contains(vinculadoId), equalTo(false));

        Response primeira = listar(tokenAgente, "?pagina=0&tamanho=1");
        assertThat(primeira.path("itens"), hasSize(1));
        assertThat(primeira.path("tamanho"), equalTo(1));
    }

    @Test
    @DisplayName("[T29] listagem traz urgentes primeiro (RN3 do front, como a D31) e, dentro do grupo, os mais recentes")
    void listagemUrgentesPrimeiro() {
        String urgente = fixture.postarProcesso(tokenAgente, null, true).then().statusCode(200).extract().path("id");
        String comum = fixture.postarProcesso(tokenAgente, null, false).then().statusCode(200).extract().path("id");

        List<Boolean> urgencias = listar(tokenAgente, "?tamanho=500").path("itens.urgente");
        int ultimoUrgente = urgencias.lastIndexOf(true);
        int primeiroComum = urgencias.indexOf(false);
        assertThat(ultimoUrgente < primeiroComum, equalTo(true));
        List<String> ids = listar(tokenAgente, "?tamanho=500").path("itens.id");
        assertThat(ids.indexOf(urgente) < ids.indexOf(comum), equalTo(true));
        List<String> datas = listar(tokenAgente, "?status=ABERTO&tamanho=500").path("itens.findAll { !it.urgente }.dataAbertura");
        assertThat(datas, equalTo(datas.stream().sorted(Comparator.reverseOrder()).toList()));

        // Mesma urgencia e mesma data de abertura: desempate pela criacao mais
        // recente, nao pelo texto do protocolo. A ordem de criacao (1000, 998,
        // 999, da mais recente para a mais antiga) difere do texto desc
        // (999, 998, 1000) e do numero desc (1000, 999, 998).
        String maisAntigo = criarComProtocolo("999/2099", "2026-01-01 08:00:00");
        String intermediario = criarComProtocolo("998/2099", "2026-01-01 09:00:00");
        String maisRecente = criarComProtocolo("1000/2099", "2026-01-01 10:00:00");
        List<String> desempate = listar(tokenAgente, "?tamanho=500").path("itens.id");
        assertThat(desempate.stream().filter(List.of(maisAntigo, intermediario, maisRecente)::contains).toList(),
                equalTo(List.of(maisRecente, intermediario, maisAntigo)));
    }

    // Processo comum com data_abertura 2026-01-01 (antiga: nao sobe para o topo
    // das listagens dos outros testes); protocolo e criado_em fixados no banco.
    @SuppressWarnings("unchecked")
    private String criarComProtocolo(String protocolo, String criadoEm) {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        corpo.put("dataAbertura", "2026-01-01");
        ((List<Map<String, Object>>) corpo.get("amostras")).get(0).put("dataColeta", "2026-01-01");
        String id = fixture.postarProcesso(tokenAgente, corpo).then().statusCode(200).extract().path("id");
        jdbcTemplate.update("UPDATE processo_sanitario SET protocolo = ?, criado_em = CAST(? AS timestamp)"
                + " WHERE id = CAST(? AS uuid)", protocolo, criadoEm, id);
        return id;
    }

    // ── Catalogos e acesso ───────────────────────────────

    @Test
    @DisplayName("[T29] catalogos com os valores do DER; sem token 401; Vet le (PROCESSOS_SANITARIOS:leitura)")
    void catalogos() {
        given().when().get(ROTA + "/catalogos").then().statusCode(401);

        Response resposta = given().header("Authorization", "Bearer " + tokenVet).when().get(ROTA + "/catalogos");

        resposta.then().statusCode(200);
        assertThat(resposta.path("doencas.codigo"), containsInAnyOrder("raiva", "esporotricose",
                "leishmaniose_visceral", "leptospirose", "febre_maculosa", "febre_amarela"));
        assertThat(resposta.path("laboratorios.codigo"), containsInAnyOrder("pasteur_sp", "ial_sorocaba", "ccz_sp", "itu_ll01"));
        assertThat(resposta.path("sintomas"), hasSize(12));
        assertThat(resposta.path("resultadosLaboratoriais.codigo"), containsInAnyOrder("aguardando", "positivo",
                "negativo", "inconclusivo", "material_inadequado", "nao_realizado"));
        assertThat(resposta.path("desfechos.codigo"), containsInAnyOrder("em_acompanhamento", "obito_natural",
                "obito_eutanasia", "obito_outro"));
    }

    @Test
    @DisplayName("[T29] GET de processo inexistente: 404")
    void processoInexistente() {
        buscar(tokenAgente, UUID.randomUUID().toString()).then().statusCode(404);
    }

    // ── Apoio ────────────────────────────────────────────

    private Response buscar(String token, String id) {
        return given().header("Authorization", "Bearer " + token).when().get(ROTA + "/" + id);
    }

    private Response listar(String token, String parametros) {
        return given().header("Authorization", "Bearer " + token).when().get(ROTA + parametros);
    }

    // O banco de teste e compartilhado: procura a linha do cenario pelo id.
    private static Map<String, Object> linhaDe(Response pagina, String id) {
        List<Map<String, Object>> itens = pagina.path("itens");
        return itens.stream().filter(item -> id.equals(item.get("id"))).findFirst().orElseThrow();
    }

    private static Map<String, Object> responsavelCompleto() {
        Map<String, Object> responsavel = new HashMap<>();
        responsavel.put("nome", "Maria Responsavel");
        responsavel.put("cpf", "123.456.789-00");
        responsavel.put("telefone", "(11) 99999-0000");
        responsavel.put("email", "maria@exemplo.com");
        responsavel.put("cep", "13300-000");
        responsavel.put("endereco", "Rua das Flores, 10");
        responsavel.put("bairroResidencial", "Centro");
        responsavel.put("bairroOcorrencia", "Vila Nova");
        return responsavel;
    }

    // Corpo da fixture com campos da (unica) amostra sobrescritos.
    @SuppressWarnings("unchecked")
    private Map<String, Object> comAmostra(Map<String, Object> campos) {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        ((List<Map<String, Object>>) corpo.get("amostras")).get(0).putAll(campos);
        return corpo;
    }

    private Map<String, Object> comAmostraDoCanil(String animalId, Map<String, Object> campos) {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        corpo.put("amostras", new ArrayList<>(List.of(amostraDoCanil(animalId, campos))));
        return corpo;
    }

    // Amostra do canil: so animalId e os campos clinicos (sem identificacao).
    private Map<String, Object> amostraDoCanil(String animalId, Map<String, Object> campos) {
        Map<String, Object> amostra = new HashMap<>();
        amostra.put("animalId", animalId);
        amostra.put("statusClinico", "ASSINTOMATICO");
        amostra.put("tipoAbrigo", "PERIDOMICILIAR");
        amostra.put("dataColeta", RelogioTesteConfig.HOJE.toString());
        amostra.put("materialBiologico", "SORO");
        amostra.put("contatoHumano", false);
        amostra.putAll(campos);
        return amostra;
    }

    private String criarAnimal(String microchip, String nome, String especie, String sexo, String raca,
            String coloracao, String pelagem, String peso, String idade) {
        return given().header("Authorization", "Bearer " + tokenAdmin).contentType(ContentType.JSON)
                .body(new CriarAnimalRequest(nome, especie, sexo, raca, coloracao, pelagem, null,
                        new BigDecimal(peso), idade, null, microchip, false, null, "em_quarentena", "resgate",
                        fixture.agora(), null, null, null))
                .when().post("/api/animais")
                .then().statusCode(200).extract().path("id");
    }

    private static void assertSnapshot(Response resposta, String especie, String sexo, String raca, String coloracao,
            String pelagem, float peso, String idade) {
        assertThat(resposta.path("amostras[0].especie.codigo"), equalTo(especie));
        assertThat(resposta.path("amostras[0].sexo"), equalTo(sexo));
        assertThat(resposta.path("amostras[0].raca"), equalTo(raca));
        assertThat(resposta.path("amostras[0].coloracao"), equalTo(coloracao));
        assertThat(resposta.path("amostras[0].pelagem"), equalTo(pelagem));
        assertThat(resposta.path("amostras[0].pesoKg"), equalTo(peso));
        assertThat(resposta.path("amostras[0].idadeAprox"), equalTo(idade));
    }

    private String criarOcorrencia() {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "zoonose");
        corpo.put("dataAbertura", RelogioTesteConfig.HOJE.toString());
        corpo.put("endereco", "Rua Teste, 1");
        corpo.put("bairro", "Centro");
        corpo.put("descricao", "Ocorrencia para processo");
        corpo.put("denunciante", Map.of("nome", "Denunciante Teste"));
        return given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON).body(corpo)
                .when().post("/api/ocorrencias")
                .then().statusCode(200).extract().path("id");
    }

    private int contar(String tabela) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + tabela, Integer.class);
    }

    private Integer ultimoProtocolo(int ano) {
        return jdbcTemplate.queryForObject(
                "SELECT ultimo FROM protocolo_sequencia WHERE entidade = 'PROCESSO' AND ano = ?", Integer.class, ano);
    }
}
