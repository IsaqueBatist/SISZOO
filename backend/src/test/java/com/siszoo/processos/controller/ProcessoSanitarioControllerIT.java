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
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Instant;
import java.time.LocalDate;
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

import javax.sql.DataSource;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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

    @Autowired
    private DataSource dataSource;

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
    @DisplayName("[T31] amostra com contato humano: urgente = true no POST, no GET e no banco")
    void comContatoUrgenteNoPostNoGetENoBanco() {
        conferirUrgencia(postarComAmostras(true), true);
    }

    @Test
    @DisplayName("[T31] amostra sem contato humano: urgente = false no POST, no GET e no banco")
    void semContatoNaoUrgenteNoPostNoGetENoBanco() {
        conferirUrgencia(postarComAmostras(false), false);
    }

    @Test
    @DisplayName("[T31] tres amostras, nenhuma com contato humano: urgente = false")
    void tresAmostrasSemContatoNaoUrgente() {
        conferirUrgencia(postarComAmostras(false, false, false), false);
    }

    @Test
    @DisplayName("[T31] tres amostras, so a ultima com contato humano: urgente = true")
    void soAUltimaDeTresComContatoUrgente() {
        conferirUrgencia(postarComAmostras(false, false, true), true);
    }

    // Uma amostra de campo por contato (a da fixture, que ja traz nivel e
    // agressao quando ha contato), com datas fixas de 2026: os processos
    // criados aqui nao sobem para o topo das listagens dos outros testes.
    @SuppressWarnings("unchecked")
    private Response postarComAmostras(boolean... contatos) {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        corpo.put("dataAbertura", DATA_ANTIGA);
        List<Map<String, Object>> amostras = new ArrayList<>();
        for (boolean contato : contatos) {
            Map<String, Object> amostra =
                    ((List<Map<String, Object>>) fixture.corpoProcesso(null, contato).get("amostras")).get(0);
            amostra.put("dataColeta", DATA_ANTIGA);
            amostras.add(amostra);
        }
        corpo.put("amostras", amostras);

        Response resposta = fixture.postarProcesso(tokenAgente, corpo);
        resposta.then().statusCode(200);
        assertThat(resposta.path("amostras"), hasSize(contatos.length));
        return resposta;
    }

    // A mesma urgencia na resposta do POST, no detalhe e na linha gravada.
    private void conferirUrgencia(Response criado, boolean esperado) {
        String id = criado.path("id");
        assertThat(criado.path("urgente"), equalTo(esperado));

        Response detalhe = buscar(tokenAgente, id);
        detalhe.then().statusCode(200);
        assertThat(detalhe.path("urgente"), equalTo(esperado));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT urgente FROM processo_sanitario WHERE id = CAST(? AS uuid)", Boolean.class, id),
                equalTo(esperado));
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
    // 6 criacoes: mais de uma para disputar a linha (PROCESSO, ano) de
    // protocolo_sequencia, com folga no pool padrao do Hikari (10; o
    // application.yml nao o configura): 6 transacoes da aplicacao + 1 conexao
    // bloqueadora + 1 de polling = 8, para as 6 estarem abertas ao mesmo tempo
    // disputando a linha, e nao esperando conexao.
    private static final int CRIACOES_CONCORRENTES = 6;
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

            List<Response> respostas = postarEmParalelo(token, corpos, ano);

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
                    ocorrencias.stream().map(this::corpoComDataAntiga).toList(), ano);

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

    // ── Resultado laboratorial e maquina de status (T34) ─

    @ParameterizedTest(name = "[T34] resultado {0}: AGUARDANDO_RESULTADO -> COM_RESULTADO no POST, no GET e no banco")
    @ValueSource(strings = {"positivo", "negativo", "inconclusivo", "material_inadequado", "nao_realizado"})
    void cadaUmDosCincoResultadosLevaAComResultado(String codigo) {
        String processoId = processoAguardandoResultado();
        String outroProcesso = processoAguardandoResultado();

        Response resposta = lancarResultado(tokenAgente, processoId, corpoResultado(codigo, HOJE, null));

        resposta.then().statusCode(200);
        assertThat(resposta.path("statusProcesso"), equalTo("COM_RESULTADO"));
        assertThat(resposta.path("resultado.codigo"), equalTo(codigo));
        assertThat(resposta.path("dataResultado"), equalTo(HOJE.toString()));
        assertThat(resposta.path("resultados"), hasSize(1));
        assertThat(resposta.path("resultados[0].resultado.codigo"), equalTo(codigo));
        assertThat(resposta.path("resultados[0].retificaId"), nullValue());
        assertThat(resposta.path("resultados[0].registradoPorNome"), equalTo("Agente Processos"));

        Response detalhe = buscar(tokenAgente, processoId);
        assertThat(detalhe.path("statusProcesso"), equalTo("COM_RESULTADO"));
        assertThat(detalhe.path("resultado.codigo"), equalTo(codigo));
        assertThat(detalhe.path("resultados[0].id"), equalTo(resposta.path("resultados[0].id")));

        Map<String, Object> gravado = jdbcTemplate.queryForMap("SELECT p.status_processo, r.codigo,"
                + " CAST(p.data_resultado AS text) AS data_resultado FROM processo_sanitario p"
                + " JOIN resultado_laboratorial r ON r.id = p.resultado_laboratorial_id WHERE p.id = CAST(? AS uuid)",
                processoId);
        assertThat(gravado.get("status_processo"), equalTo("COM_RESULTADO"));
        assertThat(gravado.get("codigo"), equalTo(codigo));
        assertThat(gravado.get("data_resultado"), equalTo(HOJE.toString()));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM resultado_processo"
                + " WHERE processo_id = CAST(? AS uuid) AND retifica_id IS NULL AND registrado_por_id = ?",
                Integer.class, processoId, idDoUsuario("agente.processos@itu.sp.gov.br")), equalTo(1));
        assertVigenteCoerente(processoId);
        // Outro processo nao e tocado.
        assertSemResultado(outroProcesso, "AGUARDANDO_RESULTADO");
    }

    @Test
    @DisplayName("[T34] aguardando, codigo inexistente, campos ausentes e data futura: 422 sem gravar nada")
    void resultadoInvalidoNaoGravaNada() {
        String processoId = processoAguardandoResultado();

        lancarResultado(tokenAgente, processoId, corpoResultado("aguardando", HOJE, null)).then().statusCode(422)
                .body("mensagem", containsString("Resultado laboratorial invalido"));
        lancarResultado(tokenAgente, processoId, corpoResultado("reagente", HOJE, null)).then().statusCode(422);
        lancarResultado(tokenAgente, processoId, Map.of("dataResultado", HOJE.toString())).then().statusCode(422);
        lancarResultado(tokenAgente, processoId, Map.of("resultado", " ", "dataResultado", HOJE.toString()))
                .then().statusCode(422);
        lancarResultado(tokenAgente, processoId, Map.of("resultado", "positivo")).then().statusCode(422);
        lancarResultado(tokenAgente, processoId, corpoResultado("positivo", HOJE.plusDays(1), null))
                .then().statusCode(422).body("mensagem", equalTo("Data do resultado nao pode ser futura"));

        assertSemResultado(processoId, "AGUARDANDO_RESULTADO");
    }

    @Test
    @DisplayName("[T34] ABERTO e CONCLUIDO recusam o lancamento (422); segundo lancamento sem retificaId: 409")
    void lancamentoSoEmAguardandoResultado() {
        String aberto = fixture.postarProcesso(tokenAgente, null, false).then().statusCode(200).extract().path("id");
        lancarResultado(tokenAgente, aberto, corpoResultado("positivo", HOJE, null)).then().statusCode(422)
                .body("mensagem", equalTo("Transicao de status nao permitida para o processo"));
        assertSemResultado(aberto, "ABERTO");

        String processoId = processoAguardandoResultado();
        lancarResultado(tokenAgente, processoId, corpoResultado("negativo", HOJE, null)).then().statusCode(200);
        lancarResultado(tokenAgente, processoId, corpoResultado("positivo", HOJE, null)).then().statusCode(409)
                .body("mensagem", containsString("informe retificaId"));

        alterarStatus(tokenAgente, processoId, "CONCLUIDO").then().statusCode(200);
        lancarResultado(tokenAgente, processoId, corpoResultado("positivo", HOJE, null)).then().statusCode(422);
        assertThat(contarResultados(processoId), equalTo(1));
        assertThat(buscar(tokenAgente, processoId).path("resultado.codigo"), equalTo("negativo"));
    }

    @Test
    @DisplayName("[T34] PATCH nao leva a COM_RESULTADO (422, sem gravar); fluxo completo ate CONCLUIDO, que e terminal")
    void maquinaDeStatusCompleta() {
        String processoId = fixture.postarProcesso(tokenAgente, null, false).then().statusCode(200).extract().path("id");

        // Pular passos e recusado.
        alterarStatus(tokenAgente, processoId, "COM_RESULTADO").then().statusCode(422);
        alterarStatus(tokenAgente, processoId, "CONCLUIDO").then().statusCode(422);
        alterarStatus(tokenAgente, processoId, "AGUARDANDO_RESULTADO").then().statusCode(200)
                .body("statusProcesso", equalTo("AGUARDANDO_RESULTADO"));

        alterarStatus(tokenAgente, processoId, "COM_RESULTADO").then().statusCode(422)
                .body("mensagem", equalTo("O status COM_RESULTADO so e alcancado pelo registro do resultado laboratorial"));
        alterarStatus(tokenAgente, processoId, "CONCLUIDO").then().statusCode(422);
        alterarStatus(tokenAgente, processoId, "ABERTO").then().statusCode(422);
        assertSemResultado(processoId, "AGUARDANDO_RESULTADO");

        lancarResultado(tokenAgente, processoId, corpoResultado("inconclusivo", HOJE, null)).then().statusCode(200)
                .body("statusProcesso", equalTo("COM_RESULTADO"));
        alterarStatus(tokenAgente, processoId, "AGUARDANDO_RESULTADO").then().statusCode(422);
        alterarStatus(tokenAgente, processoId, "CONCLUIDO").then().statusCode(200)
                .body("statusProcesso", equalTo("CONCLUIDO"));

        // CONCLUIDO e terminal: nenhum avanco, nenhum lancamento nem correcao.
        String vigente = buscar(tokenAgente, processoId).path("resultados[0].id");
        for (String status : List.of("ABERTO", "AGUARDANDO_RESULTADO", "COM_RESULTADO", "CONCLUIDO")) {
            alterarStatus(tokenAgente, processoId, status).then().statusCode(422);
        }
        lancarResultado(tokenAgente, processoId, corpoResultado("negativo", HOJE, vigente)).then().statusCode(422)
                .body("mensagem", equalTo("Resultado so pode ser corrigido com o processo em COM_RESULTADO"));
        assertThat(jdbcTemplate.queryForObject("SELECT status_processo FROM processo_sanitario WHERE id = CAST(? AS uuid)",
                String.class, processoId), equalTo("CONCLUIDO"));
        assertThat(contarResultados(processoId), equalTo(1));
        assertVigenteCoerente(processoId);
    }

    @Test
    @DisplayName("[T34] correcao: novo registro com retificaId, original intacto, vigente coerente apos cada passo e auditoria")
    void correcaoPorNovoRegistro() {
        String processoId = processoAguardandoResultado();
        String outroProcesso = processoAguardandoResultado();

        Response original = lancarResultado(tokenAgente, processoId, corpoResultado("negativo", HOJE.minusDays(2), null));
        original.then().statusCode(200);
        String originalId = original.path("resultados[0].id");
        assertVigenteCoerente(processoId);
        Map<String, Object> originalGravado = linhaDoResultado(originalId);

        Response primeira = lancarResultado(tokenVet, processoId, corpoResultado("positivo", HOJE.minusDays(1), originalId));
        primeira.then().statusCode(200);
        assertThat(primeira.path("statusProcesso"), equalTo("COM_RESULTADO"));
        assertThat(primeira.path("resultado.codigo"), equalTo("positivo"));
        assertThat(primeira.path("dataResultado"), equalTo(HOJE.minusDays(1).toString()));
        assertThat(primeira.path("resultados"), hasSize(2));
        assertThat(primeira.path("resultados[1].retificaId"), equalTo(originalId));
        assertThat(primeira.path("resultados[1].registradoPorNome"), equalTo("Vet Processos"));
        String primeiraId = primeira.path("resultados[1].id");
        assertVigenteCoerente(processoId);

        Response segunda = lancarResultado(tokenAgente, processoId, corpoResultado("inconclusivo", HOJE, primeiraId));
        segunda.then().statusCode(200);
        assertThat(segunda.path("resultados.resultado.codigo"), equalTo(List.of("negativo", "positivo", "inconclusivo")));
        assertThat(segunda.path("resultados[2].retificaId"), equalTo(primeiraId));
        assertVigenteCoerente(processoId);

        // O original nao mudou em nada e continua no historico.
        assertThat(linhaDoResultado(originalId), equalTo(originalGravado));
        assertThat(contarResultados(processoId), equalTo(3));

        // Cada registro e corrigido uma vez so; so registros do proprio processo.
        lancarResultado(tokenAgente, processoId, corpoResultado("negativo", HOJE, originalId)).then().statusCode(409)
                .body("mensagem", equalTo("Registro ja foi retificado por outro"));
        Response doOutro = lancarResultado(tokenAgente, outroProcesso, corpoResultado("negativo", HOJE, null));
        String resultadoDoOutro = doOutro.path("resultados[0].id");
        lancarResultado(tokenAgente, processoId, corpoResultado("negativo", HOJE, resultadoDoOutro)).then()
                .statusCode(422).body("mensagem", equalTo("Resultado a corrigir nao existe neste processo"));
        lancarResultado(tokenAgente, processoId, corpoResultado("negativo", HOJE, UUID.randomUUID().toString()))
                .then().statusCode(422);
        assertThat(contarResultados(processoId), equalTo(3));
        assertThat(contarResultados(outroProcesso), equalTo(1));
        assertVigenteCoerente(processoId);

        // Auditoria ATUALIZACAO do processo com o vigente antes e depois de cada correcao.
        List<Map<String, Object>> eventos = jdbcTemplate.queryForList("SELECT payload_antes ->> 'resultado' AS antes,"
                + " payload_depois ->> 'resultado' AS depois, payload_depois ->> 'statusProcesso' AS status"
                + " FROM auditoria_evento WHERE entidade = 'processo_sanitario' AND acao = 'ATUALIZACAO'"
                + " AND entidade_id = CAST(? AS uuid) AND payload_depois ->> 'resultado' IS NOT NULL"
                + " ORDER BY ocorreu_em", processoId);
        assertThat(eventos, hasSize(3));
        assertThat(eventos.get(0).get("antes"), nullValue());
        assertThat(eventos.get(0).get("depois"), equalTo("negativo"));
        assertThat(eventos.get(1).get("antes"), equalTo("negativo"));
        assertThat(eventos.get(1).get("depois"), equalTo("positivo"));
        assertThat(eventos.get(2).get("antes"), equalTo("positivo"));
        assertThat(eventos.get(2).get("depois"), equalTo("inconclusivo"));
        assertThat(eventos.get(2).get("status"), equalTo("COM_RESULTADO"));
    }

    @Test
    @DisplayName("[T34] resultado imutavel: banco recusa UPDATE e DELETE; PUT/PATCH/DELETE em /resultados: 405")
    void resultadoImutavel() {
        String processoId = processoAguardandoResultado();
        String resultadoId = lancarResultado(tokenAgente, processoId, corpoResultado("negativo", HOJE, null))
                .then().statusCode(200).extract().path("resultados[0].id");
        Map<String, Object> gravado = linhaDoResultado(resultadoId);

        assertThrows(DataIntegrityViolationException.class, () -> jdbcTemplate.update(
                "UPDATE resultado_processo SET resultado_laboratorial_id = (SELECT id FROM resultado_laboratorial"
                        + " WHERE codigo = 'positivo') WHERE id = CAST(? AS uuid)", resultadoId));
        assertThrows(DataIntegrityViolationException.class, () -> jdbcTemplate.update(
                "UPDATE resultado_processo SET observacoes = 'alterada' WHERE id = CAST(? AS uuid)", resultadoId));
        assertThrows(DataIntegrityViolationException.class, () -> jdbcTemplate.update(
                "DELETE FROM resultado_processo WHERE id = CAST(? AS uuid)", resultadoId));
        assertThat(linhaDoResultado(resultadoId), equalTo(gravado));

        String rota = ROTA + "/" + processoId + "/resultados";
        given().header("Authorization", "Bearer " + tokenAdmin).contentType(ContentType.JSON)
                .body(corpoResultado("positivo", HOJE, null)).when().put(rota).then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).contentType(ContentType.JSON)
                .body(corpoResultado("positivo", HOJE, null)).when().patch(rota).then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().delete(rota).then().statusCode(405);
        assertThat(linhaDoResultado(resultadoId), equalTo(gravado));
        assertThat(buscar(tokenAgente, processoId).path("resultado.codigo"), equalTo("negativo"));
    }

    // A garantia da V14 (um so original por processo) barra o INSERT do
    // registro antes de o processo ser alterado: a transacao inteira e
    // desfeita, sem status nem vigente gravados.
    @Test
    @DisplayName("[T34] atomicidade: violacao no INSERT do registro desfaz tudo; processo continua sem resultado")
    void falhaNoRegistroNaoAlteraOProcesso() {
        String processoId = processoAguardandoResultado();
        jdbcTemplate.update("INSERT INTO resultado_processo (processo_id, resultado_laboratorial_id, data_resultado,"
                + " registrado_por_id) SELECT CAST(? AS uuid), id, ?, ? FROM resultado_laboratorial"
                + " WHERE codigo = 'negativo'", processoId, HOJE, idDoUsuario("agente.processos@itu.sp.gov.br"));
        int eventosAntes = eventosDeAtualizacao(processoId);

        lancarResultado(tokenAgente, processoId, corpoResultado("positivo", HOJE, null)).then().statusCode(409)
                .body("mensagem", containsString("informe retificaId"));

        assertSemResultadoVigente(processoId, "AGUARDANDO_RESULTADO");
        assertThat(contarResultados(processoId), equalTo(1));
        assertThat(eventosDeAtualizacao(processoId), equalTo(eventosAntes));
    }

    // 6 lancamentos do primeiro resultado no mesmo processo, no padrao da T30:
    // uma conexao do teste trava a linha do processo (FOR UPDATE, sem commit);
    // so quando pg_stat_activity mostra as 6 transacoes esperando por ela o
    // teste libera (rollback). Pool: 6 + bloqueadora + polling = 8 de 10.
    @Test
    @DisplayName("[T34] 6 lancamentos simultaneos do primeiro resultado: um 200, cinco 409, um so registro original")
    void lancamentosConcorrentesDoPrimeiroResultado() throws Exception {
        String processoId = processoAguardandoResultado();
        CountDownLatch largada = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(CRIACOES_CONCORRENTES);
        List<Future<Response>> futuros = new ArrayList<>();
        try {
            try (Connection bloqueio = dataSource.getConnection()) {
                bloqueio.setAutoCommit(false);
                try {
                    try (PreparedStatement trava = bloqueio.prepareStatement(
                            "SELECT id FROM processo_sanitario WHERE id = CAST(? AS uuid) FOR UPDATE")) {
                        trava.setString(1, processoId);
                        trava.executeQuery().close();
                    }
                    for (int i = 0; i < CRIACOES_CONCORRENTES; i++) {
                        String codigo = i % 2 == 0 ? "positivo" : "negativo";
                        futuros.add(executor.submit(() -> {
                            if (!largada.await(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS)) {
                                throw new IllegalStateException("largada nao liberada em " + TIMEOUT_SEGUNDOS + " s");
                            }
                            return lancarResultado(tokenAgente, processoId, corpoResultado(codigo, HOJE, null));
                        }));
                    }
                    largada.countDown();
                    aguardarLancamentosBloqueados(futuros, pidDe(bloqueio));
                } finally {
                    bloqueio.rollback();
                }
            }

            List<Integer> status = new ArrayList<>();
            for (Future<Response> futuro : futuros) {
                try {
                    status.add(futuro.get(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS).statusCode());
                } catch (TimeoutException e) {
                    fail("POST de resultado nao terminou em " + TIMEOUT_SEGUNDOS + " s (bloqueio ou deadlock?)");
                }
            }
            assertThat(status.stream().filter(s -> s == 200).count(), equalTo(1L));
            assertThat(status.stream().filter(s -> s == 409).count(), equalTo((long) CRIACOES_CONCORRENTES - 1));
        } finally {
            executor.shutdownNow();
            if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
                fail("Requisicoes ainda em execucao apos o encerramento");
            }
        }
        assertThat(contarResultados(processoId), equalTo(1));
        assertThat(jdbcTemplate.queryForObject("SELECT status_processo FROM processo_sanitario WHERE id = CAST(? AS uuid)",
                String.class, processoId), equalTo("COM_RESULTADO"));
        assertVigenteCoerente(processoId);
    }

    @Test
    @DisplayName("[T34] lancar resultado: sem token 401; sem PROCESSOS_SANITARIOS:escrita 403 sem gravar; processo inexistente 404")
    void acessoAoLancamento() {
        String processoId = processoAguardandoResultado();
        String tokenLeitor = fixture.tokenLeitorOcorrencias("leitor.resultado@itu.sp.gov.br", "Resultado");

        given().contentType(ContentType.JSON).body(corpoResultado("positivo", HOJE, null))
                .when().post(ROTA + "/" + processoId + "/resultados").then().statusCode(401);
        lancarResultado(tokenLeitor, processoId, corpoResultado("positivo", HOJE, null)).then().statusCode(403);
        assertSemResultado(processoId, "AGUARDANDO_RESULTADO");

        lancarResultado(tokenAgente, UUID.randomUUID().toString(), corpoResultado("positivo", HOJE, null))
                .then().statusCode(404);
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

    private static final LocalDate HOJE = RelogioTesteConfig.HOJE;

    private String processoAguardandoResultado() {
        String id = fixture.postarProcesso(tokenAgente, null, false).then().statusCode(200).extract().path("id");
        alterarStatus(tokenAgente, id, "AGUARDANDO_RESULTADO").then().statusCode(200);
        return id;
    }

    private Response alterarStatus(String token, String processoId, String status) {
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("status", status))
                .when().patch(ROTA + "/" + processoId + "/status");
    }

    private Response lancarResultado(String token, String processoId, Map<String, Object> corpo) {
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(corpo)
                .when().post(ROTA + "/" + processoId + "/resultados");
    }

    private static Map<String, Object> corpoResultado(String codigo, LocalDate data, String retificaId) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("resultado", codigo);
        corpo.put("dataResultado", data.toString());
        corpo.put("observacoes", "Laudo " + codigo);
        if (retificaId != null) {
            corpo.put("retificaId", retificaId);
        }
        return corpo;
    }

    // O vigente gravado em processo_sanitario e sempre o do unico registro
    // que nenhum outro corrige (queryForMap falha se houver zero ou mais de um).
    private void assertVigenteCoerente(String processoId) {
        Map<String, Object> vigente = jdbcTemplate.queryForMap("SELECT p.resultado_laboratorial_id, p.data_resultado"
                + " FROM processo_sanitario p WHERE p.id = CAST(? AS uuid)", processoId);
        Map<String, Object> ultimo = jdbcTemplate.queryForMap("SELECT r.resultado_laboratorial_id, r.data_resultado"
                + " FROM resultado_processo r WHERE r.processo_id = CAST(? AS uuid)"
                + " AND NOT EXISTS (SELECT 1 FROM resultado_processo c WHERE c.retifica_id = r.id)", processoId);
        assertThat(vigente, equalTo(ultimo));
    }

    private void assertSemResultado(String processoId, String status) {
        assertSemResultadoVigente(processoId, status);
        assertThat(contarResultados(processoId), equalTo(0));
    }

    private void assertSemResultadoVigente(String processoId, String status) {
        Map<String, Object> gravado = jdbcTemplate.queryForMap("SELECT status_processo, resultado_laboratorial_id,"
                + " data_resultado FROM processo_sanitario WHERE id = CAST(? AS uuid)", processoId);
        assertThat(gravado.get("status_processo"), equalTo(status));
        assertThat(gravado.get("resultado_laboratorial_id"), nullValue());
        assertThat(gravado.get("data_resultado"), nullValue());
    }

    private int contarResultados(String processoId) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM resultado_processo WHERE processo_id = CAST(? AS uuid)",
                Integer.class, processoId);
    }

    private Map<String, Object> linhaDoResultado(String resultadoId) {
        return jdbcTemplate.queryForMap("SELECT * FROM resultado_processo WHERE id = CAST(? AS uuid)", resultadoId);
    }

    private UUID idDoUsuario(String email) {
        return jdbcTemplate.queryForObject("SELECT id FROM usuario WHERE email = ?", UUID.class, email);
    }

    private int eventosDeAtualizacao(String processoId) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM auditoria_evento WHERE entidade = 'processo_sanitario'"
                + " AND acao = 'ATUALIZACAO' AND entidade_id = CAST(? AS uuid)", Integer.class, processoId);
    }

    // Espera as N requisicoes paradas ao mesmo tempo no lock da linha do
    // processo (findByIdForUpdate), presas pela conexao bloqueadora (direta ou
    // indiretamente, na fila do lock de tupla). Uma requisicao que termina
    // antes nao esperou as demais.
    private void aguardarLancamentosBloqueados(List<Future<Response>> futuros, int pidBloqueio) throws Exception {
        long limite = System.nanoTime() + TimeUnit.SECONDS.toNanos(TIMEOUT_SEGUNDOS);
        int bloqueados = 0;
        while (System.nanoTime() < limite) {
            for (Future<Response> futuro : futuros) {
                if (futuro.isDone()) {
                    throw new AssertionError("Uma requisicao terminou sem esperar as demais: " + futuro.get().asString());
                }
            }
            bloqueados = jdbcTemplate.queryForObject("""
                    SELECT count(*) FROM pg_stat_activity
                    WHERE pid <> pg_backend_pid() AND pid <> ? AND state = 'active'
                      AND wait_event_type = 'Lock'
                      AND query ILIKE '%from processo_sanitario%'
                      AND query ILIKE '%for %update%'
                    """, Integer.class, pidBloqueio);
            if (bloqueados == futuros.size()) {
                return;
            }
            Thread.sleep(50);
        }
        throw new AssertionError("Esperadas " + futuros.size() + " transacoes paradas no lock do processo;"
                + " vistas " + bloqueados);
    }

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

    // Prova de simultaneidade no banco (padrao do VacinacaoControllerIT): uma
    // conexao do teste insere, sem commit, a linha (PROCESSO, ano) da
    // sequencia; o upsert de cada requisicao esbarra nela e espera. So quando
    // pg_stat_activity mostra as N transacoes esperando juntas o teste libera
    // (rollback), e as N disputam a mesma linha. O rollback deixa a sequencia
    // vazia, entao o esperado continua 001..N. Prova que as N transacoes
    // estavam abertas ao mesmo tempo disputando a linha; nao prova ausencia
    // de deadlock em geral. A lista devolvida segue a ordem dos corpos (nao a
    // de conclusao).
    private List<Response> postarEmParalelo(String token, List<Map<String, Object>> corpos, int ano)
            throws Exception {
        CountDownLatch largada = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(corpos.size());
        Throwable falha = null;
        try (Connection bloqueio = dataSource.getConnection()) {
            bloqueio.setAutoCommit(false);
            int pidBloqueio = pidDe(bloqueio);
            List<Future<Response>> futuros = new ArrayList<>();
            // O rollback fica no finally: libera os upserts presos (e deixa a
            // sequencia vazia) tambem quando a espera falha, antes do
            // encerramento do executor.
            try {
                try (PreparedStatement insert = bloqueio.prepareStatement(
                        "INSERT INTO protocolo_sequencia (entidade, ano, ultimo) VALUES ('PROCESSO', ?, 1)")) {
                    insert.setInt(1, ano);
                    insert.executeUpdate();
                }
                for (Map<String, Object> corpo : corpos) {
                    futuros.add(executor.submit(() -> {
                        if (!largada.await(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS)) {
                            throw new IllegalStateException("largada nao liberada em " + TIMEOUT_SEGUNDOS + " s");
                        }
                        return fixture.postarProcesso(token, corpo);
                    }));
                }
                largada.countDown();
                aguardarUpsertsBloqueados(futuros, pidBloqueio);
            } finally {
                bloqueio.rollback();
            }

            List<Response> respostas = new ArrayList<>();
            for (Future<Response> futuro : futuros) {
                try {
                    respostas.add(futuro.get(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS));
                } catch (TimeoutException e) {
                    fail("POST " + ROTA + " nao terminou em " + TIMEOUT_SEGUNDOS + " s (bloqueio ou deadlock?)");
                }
            }
            return respostas;
        } catch (Throwable t) {
            falha = t;
            throw t;
        } finally {
            // shutdownNow so interrompe as threads do teste: o trabalho ja
            // iniciado no servidor nao e cancelado. Se elas nao terminam, o
            // teste falha dizendo isso, em vez de seguir (e restaurar o
            // relogio) com requisicoes ainda em curso.
            executor.shutdownNow();
            if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
                AssertionError pendentes = new AssertionError("Requisicoes ainda em execucao apos o encerramento;"
                        + " o servidor nao cancela o trabalho ja iniciado");
                if (falha != null) {
                    falha.addSuppressed(pendentes);
                } else {
                    throw pendentes;
                }
            }
        }
    }

    private static int pidDe(Connection conexao) throws Exception {
        try (Statement consulta = conexao.createStatement();
                ResultSet resultado = consulta.executeQuery("SELECT pg_backend_pid()")) {
            resultado.next();
            return resultado.getInt(1);
        }
    }

    // Espera ate as N requisicoes estarem paradas no upsert do protocolo ao
    // mesmo tempo. Conta so sessoes ativas que esperam a transacao da conexao
    // bloqueadora (pg_blocking_pids) no INSERT da sequencia; a propria sessao
    // de polling e a bloqueadora (idle in transaction) ficam de fora por
    // construcao. Uma requisicao que termina antes nao esperou as demais.
    private void aguardarUpsertsBloqueados(List<Future<Response>> futuros, int pidBloqueio) throws Exception {
        long limite = System.nanoTime() + TimeUnit.SECONDS.toNanos(TIMEOUT_SEGUNDOS);
        int bloqueados = 0;
        while (System.nanoTime() < limite) {
            for (Future<Response> futuro : futuros) {
                if (futuro.isDone()) {
                    throw new AssertionError("Uma requisicao terminou sem esperar as demais: " + futuro.get().asString());
                }
            }
            bloqueados = jdbcTemplate.queryForObject("""
                    SELECT count(*) FROM pg_stat_activity
                    WHERE pid <> pg_backend_pid() AND state = 'active'
                      AND wait_event_type = 'Lock' AND wait_event = 'transactionid'
                      AND ? = ANY(pg_blocking_pids(pid))
                      AND query ILIKE '%insert into protocolo_sequencia%'
                    """, Integer.class, pidBloqueio);
            if (bloqueados == futuros.size()) {
                return;
            }
            Thread.sleep(50);
        }
        throw new AssertionError("Esperadas " + futuros.size() + " transacoes paradas no upsert do protocolo;"
                + " vistas " + bloqueados);
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
