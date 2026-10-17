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
import static org.junit.jupiter.api.Assertions.fail;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.stream.IntStream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;

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

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private ProcessoSanitarioRepository processoRepository;

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

    // Segunda barreira (a primeira e o finally de cada teste): nenhum teste
    // seguinte herda o relogio de um ano isolado (T30).
    @AfterEach
    void restaurarRelogio() {
        RelogioTesteConfig.restaurar();
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

    // updatable = false tira a coluna do UPDATE que o Hibernate gera para a
    // entidade; nao impede SQL direto (nao ha garantia no banco).
    @Test
    @DisplayName("[T30] alterar o processo pela entidade nao muda o protocolo gravado")
    void protocoloNaoEntraNoUpdateDoProcesso() {
        Response criado = fixture.postarProcesso(tokenAgente, null, false);
        criado.then().statusCode(200);
        String id = criado.path("id");
        String protocolo = criado.path("protocolo");

        transactionTemplate.executeWithoutResult(status -> {
            ProcessoSanitario processo = processoRepository.findById(UUID.fromString(id)).orElseThrow();
            processo.setProtocolo("000/1999");
            processo.setObservacoes("Observacao alterada");
        });

        Map<String, Object> gravado = jdbcTemplate.queryForMap(
                "SELECT protocolo, observacoes FROM processo_sanitario WHERE id = CAST(? AS uuid)", id);
        // A observacao prova que o UPDATE aconteceu; o protocolo ficou fora dele.
        assertThat(gravado.get("observacoes"), equalTo("Observacao alterada"));
        assertThat(gravado.get("protocolo"), equalTo(protocolo));
    }

    // ── Concorrencia do protocolo pela API (T30) ─────────
    // 8 criacoes: mais de uma para disputar a linha (PROCESSO, ano) de
    // protocolo_sequencia e nao mais que o pool padrao do Hikari (10; o
    // application.yml nao o configura), para as 8 transacoes estarem abertas ao
    // mesmo tempo disputando o lock da linha, e nao esperando conexao.
    private static final int CRIACOES_CONCORRENTES = 8;
    private static final long TIMEOUT_SEGUNDOS = 30;
    // Datas de negocio fixas e no passado em relacao ao relogio ajustado: o ano
    // do protocolo vem do Clock, nao da data de abertura (D21), e as linhas
    // criadas aqui nao sobem para o topo das listagens dos outros testes, que
    // usam o mesmo banco sem rollback.
    private static final String DATA_ANTIGA = "2026-01-01";

    @Test
    @DisplayName("[T30] POST /api/processos simultaneos sem ocorrencia: todos 200, protocolos 001..N do ano, sem duplicata nem lacuna")
    void processosConcorrentesSemOcorrencia() throws Exception {
        int ano = 2094;
        prepararAnoVazio(ano);
        RelogioTesteConfig.fixarEm(Instant.parse(ano + "-06-15T15:00:00Z"));
        try {
            String token = tokenNoRelogioAjustado();
            List<Map<String, Object>> corpos = IntStream.range(0, CRIACOES_CONCORRENTES)
                    .mapToObj(i -> corpoComDataAntiga(null))
                    .toList();

            List<Response> respostas = postarEmParalelo(token, corpos);

            verificarProtocolosDoAno(respostas, ano);
            for (Response resposta : respostas) {
                assertThat(resposta.path("ocorrenciaId"), nullValue());
            }
        } finally {
            RelogioTesteConfig.restaurar();
        }
    }

    @Test
    @DisplayName("[T30] POST /api/processos simultaneos, cada um com sua ocorrencia: protocolos 001..N do ano e vinculo correto")
    void processosConcorrentesComOcorrencia() throws Exception {
        int ano = 2095;
        prepararAnoVazio(ano);
        RelogioTesteConfig.fixarEm(Instant.parse(ano + "-06-15T15:00:00Z"));
        try {
            String token = tokenNoRelogioAjustado();
            // Uma ocorrencia por processo, criadas antes e em sequencia: a
            // disputa e so pela sequencia de PROCESSO, nao pelo mesmo vinculo.
            List<String> ocorrencias = new ArrayList<>();
            for (int i = 0; i < CRIACOES_CONCORRENTES; i++) {
                ocorrencias.add(criarOcorrencia(token, DATA_ANTIGA));
            }

            List<Response> respostas = postarEmParalelo(token,
                    ocorrencias.stream().map(this::corpoComDataAntiga).toList());

            verificarProtocolosDoAno(respostas, ano);
            // respostas.get(i) e a resposta do corpo i (ordem de envio, nao de conclusao).
            for (int i = 0; i < CRIACOES_CONCORRENTES; i++) {
                String processoId = respostas.get(i).path("id");
                assertThat(respostas.get(i).path("ocorrenciaId"), equalTo(ocorrencias.get(i)));
                assertThat(jdbcTemplate.queryForObject(
                        "SELECT CAST(ocorrencia_id AS text) FROM processo_sanitario WHERE id = CAST(? AS uuid)",
                        String.class, processoId), equalTo(ocorrencias.get(i)));
            }
        } finally {
            RelogioTesteConfig.restaurar();
        }
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
        return criarOcorrencia(tokenAgente, RelogioTesteConfig.HOJE.toString());
    }

    private String criarOcorrencia(String token, String dataAbertura) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "zoonose");
        corpo.put("dataAbertura", dataAbertura);
        corpo.put("endereco", "Rua Teste, 1");
        corpo.put("bairro", "Centro");
        corpo.put("descricao", "Ocorrencia para processo");
        corpo.put("denunciante", Map.of("nome", "Denunciante Teste"));
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON).body(corpo)
                .when().post("/api/ocorrencias")
                .then().statusCode(200).extract().path("id");
    }

    // O ano isolado so e usado pelo seu teste, e o banco do contexto e novo a
    // cada execucao; mesmo assim confere que nenhum processo do ano existe (o
    // 001 colidiria com o UNIQUE de protocolo) e zera a sequencia do ano, como
    // os testes de 2091-2093 do OcorrenciaTransacaoIT.
    private void prepararAnoVazio(int ano) {
        assertThat("processos ja existentes em " + ano, jdbcTemplate.queryForObject(
                "SELECT count(*) FROM processo_sanitario WHERE protocolo LIKE ?", Integer.class, "%/" + ano),
                equalTo(0));
        jdbcTemplate.update("DELETE FROM protocolo_sequencia WHERE entidade = 'PROCESSO' AND ano = ?", ano);
    }

    // Login depois de ajustar o relogio: o token do @BeforeEach foi emitido em
    // 2026 e estaria vencido no relogio do ano isolado. Usuario proprio, para
    // nao misturar com os perfis dos outros testes.
    private String tokenNoRelogioAjustado() {
        return fixture.tokenComCargo("agente.concorrencia.processos@itu.sp.gov.br", "Agente", "Concorrencia",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> corpoComDataAntiga(String ocorrenciaId) {
        Map<String, Object> corpo = fixture.corpoProcesso(ocorrenciaId, false);
        corpo.put("dataAbertura", DATA_ANTIGA);
        ((List<Map<String, Object>>) corpo.get("amostras")).get(0).put("dataColeta", DATA_ANTIGA);
        return corpo;
    }

    // Todas as requisicoes esperam a mesma largada; a lista devolvida segue a
    // ordem dos corpos (nao a de conclusao). Uma requisicao que nao termina no
    // prazo falha o teste em vez de travar a suite.
    private List<Response> postarEmParalelo(String token, List<Map<String, Object>> corpos) throws Exception {
        CountDownLatch largada = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(corpos.size());
        try {
            List<Future<Response>> futuros = new ArrayList<>();
            for (Map<String, Object> corpo : corpos) {
                futuros.add(executor.submit(() -> {
                    if (!largada.await(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("largada nao liberada em " + TIMEOUT_SEGUNDOS + " s");
                    }
                    return fixture.postarProcesso(token, corpo);
                }));
            }
            largada.countDown();
            List<Response> respostas = new ArrayList<>();
            for (Future<Response> futuro : futuros) {
                try {
                    respostas.add(futuro.get(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS));
                } catch (TimeoutException e) {
                    fail("POST " + ROTA + " nao terminou em " + TIMEOUT_SEGUNDOS + " s (bloqueio ou deadlock?)");
                }
            }
            return respostas;
        } finally {
            executor.shutdownNow();
            executor.awaitTermination(10, TimeUnit.SECONDS);
        }
    }

    // Sem depender da ordem: cada resposta 200 com protocolo do ano igual ao
    // gravado; os numeros, ordenados, sao exatamente 1..N (duplicata ou lacuna
    // falham); e nao ha no banco outro processo do ano alem destes.
    private void verificarProtocolosDoAno(List<Response> respostas, int ano) {
        List<String> protocolos = new ArrayList<>();
        List<Integer> numeros = new ArrayList<>();
        for (Response resposta : respostas) {
            resposta.then().statusCode(200);
            String protocolo = resposta.path("protocolo");
            assertThat(protocolo, matchesPattern("\\d{3,}/" + ano));
            assertThat(jdbcTemplate.queryForObject(
                    "SELECT protocolo FROM processo_sanitario WHERE id = CAST(? AS uuid)",
                    String.class, (String) resposta.path("id")), equalTo(protocolo));
            protocolos.add(protocolo);
            numeros.add(Integer.parseInt(protocolo.substring(0, protocolo.indexOf('/'))));
        }
        Collections.sort(numeros);
        assertThat(numeros, equalTo(IntStream.rangeClosed(1, respostas.size()).boxed().toList()));
        assertThat(jdbcTemplate.queryForList(
                "SELECT protocolo FROM processo_sanitario WHERE protocolo LIKE ?", String.class, "%/" + ano),
                containsInAnyOrder(protocolos.toArray(String[]::new)));
    }

    private int contar(String tabela) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + tabela, Integer.class);
    }

    private Integer ultimoProtocolo(int ano) {
        return jdbcTemplate.queryForObject(
                "SELECT ultimo FROM protocolo_sequencia WHERE entidade = 'PROCESSO' AND ano = ?", Integer.class, ano);
    }
}
