package com.siszoo.ocorrencias.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

// Relogio fixo (RelogioTesteConfig): D21 compara dataAbertura com o "hoje" do
// Clock, e o protocolo usa o ano do Clock (2026).
@Import(RelogioTesteConfig.class)
class OcorrenciaControllerIT extends AbstractIntegrationTest {

    private static final String ROTA = "/api/ocorrencias";
    private static final LocalDate HOJE = RelogioTesteConfig.HOJE;

    // Assinaturas minimas aceitas pela deteccao de tipo do service.
    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01};
    private static final byte[] GIF = {0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00};

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private String tokenAdmin;
    private String tokenAgente;
    private String tokenVet;
    // Le o modulo sem denunciante_sigiloso: o perfil que recebe a mascara (D14).
    // Nenhum cargo real e assim desde a V11 (Vet sem acesso a ocorrencias).
    private String tokenLeitor;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin("admin.ocorrencias@itu.sp.gov.br", "Ocorrencias");
        tokenAgente = fixture.tokenComCargo("agente.ocorrencias@itu.sp.gov.br", "Agente", "Ocorrencias",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        tokenVet = fixture.tokenComCargo("vet.ocorrencias@itu.sp.gov.br", "Vet", "Ocorrencias",
                ApiTesteFixture.CARGO_VETERINARIO_ID);
        tokenLeitor = fixture.tokenLeitorOcorrencias("leitor.ocorrencias@itu.sp.gov.br", "Ocorrencias");
    }

    // ── Cadastro, leitura e acesso ───────────────────────

    @Test
    @DisplayName("Cria ocorrencia sem processo: protocolo NNN/AAAA, ABERTA e movimentacao REGISTRADA")
    void deveCriarOcorrenciaComProtocoloEMovimentacaoInicial() {
        Response resposta = criar(tokenAgente, corpo());

        resposta.then().statusCode(200);
        assertThat(resposta.path("protocolo"), matchesPattern("\\d{3,}/2026"));
        assertThat(resposta.path("statusOcorrencia"), equalTo("ABERTA"));
        assertThat(resposta.path("processoVinculado"), nullValue());
        assertThat(resposta.path("movimentacoes"), hasSize(1));
        assertThat(resposta.path("movimentacoes[0].tipoMovimentacao"), equalTo("REGISTRADA"));
        assertThat(resposta.path("movimentacoes[0].statusAnterior"), nullValue());
        assertThat(resposta.path("movimentacoes[0].statusNovo"), equalTo("ABERTA"));
        assertThat(resposta.path("podeVerDenunciante"), equalTo(true));
    }

    @Test
    @DisplayName("Sem token: 401; id inexistente: 404; Vet lendo ou escrevendo: 403 (V11); DELETE: 405")
    void deveAplicarAcessoBasico() {
        given().when().get(ROTA).then().statusCode(401);
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA + "/" + UUID.randomUUID()).then().statusCode(404);
        criar(tokenVet, corpo()).then().statusCode(403);

        String id = idDe(criar(tokenAdmin, corpo()));
        comToken(tokenVet).when().get(ROTA).then().statusCode(403);
        comToken(tokenVet).when().get(ROTA + "/" + id).then().statusCode(403);
        comToken(tokenVet).when().get(ROTA + "/catalogos").then().statusCode(403);
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().delete(ROTA + "/" + id).then().statusCode(405);
    }

    @Test
    @DisplayName("Flags omitidas no cadastro valem false (Jackson 3 recusaria null em boolean primitivo)")
    void flagsOmitidasValemFalse() {
        Map<String, Object> corpo = corpo();
        corpo.remove("urgente");
        corpo.remove("sigilosa");
        corpo.remove("anonima");

        Response resposta = criar(tokenAgente, corpo);

        resposta.then().statusCode(200);
        assertThat(resposta.path("urgente"), equalTo(false));
        assertThat(resposta.path("sigilosa"), equalTo(false));
        assertThat(resposta.path("anonima"), equalTo(false));
    }

    @Test
    @DisplayName("[D21] dataAbertura futura: 422")
    void deveRecusarDataAberturaFutura() {
        Map<String, Object> corpo = corpo();
        corpo.put("dataAbertura", HOJE.plusDays(1).toString());

        criar(tokenAgente, corpo).then().statusCode(422);
    }

    @Test
    @DisplayName("[D19] nao sigilosa e nao anonima sem nome do denunciante: 422")
    void deveExigirNomeQuandoNaoSigilosaNemAnonima() {
        Map<String, Object> corpo = corpo();
        corpo.put("denunciante", Map.of("telefone", "(11) 9 0000-0000"));

        criar(tokenAgente, corpo).then().statusCode(422);
    }

    // ── Sigilo (D14) ─────────────────────────────────────

    @Test
    @DisplayName("[D14] sigilosa: Admin e Agente veem o denunciante, leitor sem a feature recebe null, Vet 403;"
            + " denunciado nunca e mascarado")
    void sigiloPorPerfil() {
        String nome = "Denunciante Sigiloso " + UUID.randomUUID();
        Map<String, Object> corpo = corpo();
        corpo.put("sigilosa", true);
        corpo.put("denunciante", Map.of("nome", nome, "cpf", "123.456.789-00"));
        corpo.put("denunciado", Map.of("nome", "Vizinho Denunciado"));
        String id = idDe(criar(tokenAgente, corpo));

        Response admin = detalhe(tokenAdmin, id);
        Response agente = detalhe(tokenAgente, id);
        Response leitor = detalhe(tokenLeitor, id);

        assertThat(admin.path("denunciante.nome"), equalTo(nome));
        assertThat(agente.path("denunciante.nome"), equalTo(nome));
        assertThat(leitor.path("denunciante.nome"), nullValue());
        assertThat(leitor.path("denunciante.cpf"), nullValue());
        assertThat(leitor.path("podeVerDenunciante"), equalTo(false));
        assertThat(leitor.path("denunciado.nome"), equalTo("Vizinho Denunciado"));
        comToken(tokenVet).when().get(ROTA + "/" + id).then().statusCode(403);
    }

    @Test
    @DisplayName("[D14/T26] busca pelo nome real de denunciante sigiloso nao encontra para ninguem; pelo protocolo encontra")
    void buscaPorNomeNaoVazaSigilo() {
        String nome = "Nomebusca" + UUID.randomUUID().toString().substring(0, 8);
        Map<String, Object> corpo = corpo();
        corpo.put("sigilosa", true);
        corpo.put("denunciante", Map.of("nome", nome));
        String protocolo = criar(tokenAgente, corpo).then().statusCode(200).extract().path("protocolo");

        for (String token : List.of(tokenAdmin, tokenAgente, tokenLeitor)) {
            assertThat(listar(token, nome).path("totalItens"), equalTo(0));
            assertThat(listar(token, protocolo).path("totalItens"), equalTo(1));
        }
    }

    @Test
    @DisplayName("[D14/T26] listagem: nome do denunciante null em sigilosa para todos os perfis; real em nao sigilosa")
    void listagemNaoExpoeDenuncianteSigiloso() {
        String bairro = "BairroLista" + UUID.randomUUID().toString().substring(0, 8);
        Map<String, Object> sigilosa = corpo();
        sigilosa.put("bairro", bairro);
        sigilosa.put("sigilosa", true);
        sigilosa.put("denunciante", Map.of("nome", "Sigiloso Lista " + bairro));
        String idSigilosa = idDe(criar(tokenAgente, sigilosa));
        Map<String, Object> publica = corpo();
        publica.put("bairro", bairro);
        publica.put("denunciante", Map.of("nome", "Publico Lista " + bairro));
        String idPublica = idDe(criar(tokenAgente, publica));

        for (String token : List.of(tokenAdmin, tokenAgente, tokenLeitor)) {
            Response lista = listar(token, bairro);
            assertThat(lista.path("totalItens"), equalTo(2));
            assertThat(lista.path("itens.find { it.id == '" + idSigilosa + "' }.denuncianteNome"), nullValue());
            assertThat(lista.path("itens.find { it.id == '" + idPublica + "' }.denuncianteNome"),
                    equalTo("Publico Lista " + bairro));
            assertThat(lista.asString(), not(containsString("Sigiloso Lista")));
        }
    }

    // ── Edicao (D10) ─────────────────────────────────────

    @Test
    @DisplayName("[D10] PUT sem o bloco denunciante mantem os dados; com o bloco, substitui; Vet recebe 403")
    void putSubstituiOuMantemDenunciante() {
        Map<String, Object> corpo = corpo();
        corpo.put("sigilosa", true);
        corpo.put("denunciante", Map.of("nome", "Original", "telefone", "(11) 1111-1111"));
        String id = idDe(criar(tokenAgente, corpo));

        Map<String, Object> semBloco = corpoPut(corpo);
        semBloco.remove("denunciante");
        semBloco.put("descricao", "Descricao revisada");
        atualizar(tokenAgente, id, semBloco).then().statusCode(200);
        assertThat(detalhe(tokenAdmin, id).path("denunciante.nome"), equalTo("Original"));
        assertThat(detalhe(tokenAdmin, id).path("denunciante.telefone"), equalTo("(11) 1111-1111"));

        Map<String, Object> comBloco = corpoPut(corpo);
        comBloco.put("denunciante", Map.of("nome", "Substituido"));
        atualizar(tokenAgente, id, comBloco).then().statusCode(200);
        assertThat(detalhe(tokenAdmin, id).path("denunciante.nome"), equalTo("Substituido"));
        assertThat(detalhe(tokenAdmin, id).path("denunciante.telefone"), nullValue());

        atualizar(tokenVet, id, semBloco).then().statusCode(403);
    }

    // ── Status, encerramento e notas (D5, D37) ───────────

    @Test
    @DisplayName("[D5] ABERTA -> EM_ATENDIMENTO gera EQUIPE_DESPACHADA; repetir da 422")
    void iniciarAtendimento() {
        String id = idDe(criar(tokenAgente, corpo()));

        Response resposta = alterarStatus(tokenAgente, id, "EM_ATENDIMENTO");
        resposta.then().statusCode(200);
        assertThat(resposta.path("statusOcorrencia"), equalTo("EM_ATENDIMENTO"));
        assertThat(resposta.path("movimentacoes[0].tipoMovimentacao"), equalTo("EQUIPE_DESPACHADA"));
        assertThat(resposta.path("movimentacoes[0].statusAnterior"), equalTo("ABERTA"));
        assertThat(resposta.path("movimentacoes[0].statusNovo"), equalTo("EM_ATENDIMENTO"));

        alterarStatus(tokenAgente, id, "EM_ATENDIMENTO").then().statusCode(422);
        alterarStatus(tokenAgente, id, "ENCERRADA").then().statusCode(422);
    }

    @Test
    @DisplayName("[D25/D5] encerramento: sem providencia 422; outro sem descricao 422; outro com descricao 200")
    void regrasDeEncerramento() {
        String id = idDe(criar(tokenAgente, corpo()));
        alterarStatus(tokenAgente, id, "EM_ATENDIMENTO").then().statusCode(200);

        encerrar(tokenAgente, id, Map.of("providenciaTomada", "")).then().statusCode(422);
        encerrar(tokenAgente, id, Map.of("providenciaTomada", "outro")).then().statusCode(422);
        encerrar(tokenAgente, id, Map.of("providenciaTomada", "inexistente")).then().statusCode(422);

        Response resposta = encerrar(tokenAgente, id, Map.of("providenciaTomada", "outro", "descricaoEncerramento", "Orientado por telefone"));
        resposta.then().statusCode(200);
        assertThat(resposta.path("statusOcorrencia"), equalTo("ENCERRADA"));
        assertThat(resposta.path("providenciaTomada"), equalTo("outro"));
        assertThat(resposta.path("movimentacoes[0].tipoMovimentacao"), equalTo("ENCERRADA"));
        assertThat(resposta.path("movimentacoes[0].statusAnterior"), equalTo("EM_ATENDIMENTO"));
    }

    @Test
    @DisplayName("[D5] ABERTA -> ENCERRADA so com sem_acao, orientacao_municipe ou registro_indevido")
    void encerramentoDiretoDeAberta() {
        String recusada = idDe(criar(tokenAgente, corpo()));
        encerrar(tokenAgente, recusada, Map.of("providenciaTomada", "captura_remocao")).then().statusCode(422);

        for (String providencia : List.of("sem_acao", "orientacao_municipe", "registro_indevido")) {
            String id = idDe(criar(tokenAgente, corpo()));
            Response resposta = encerrar(tokenAgente, id, Map.of("providenciaTomada", providencia));
            resposta.then().statusCode(200);
            assertThat(resposta.path("movimentacoes[0].statusAnterior"), equalTo("ABERTA"));
        }
    }

    @Test
    @DisplayName("[D10/D20/D37] ocorrencia encerrada recusa PUT, nota, anexo e vinculo (422)")
    void encerradaNaoAceitaAlteracoes() {
        Map<String, Object> corpo = corpo();
        String id = idDe(criar(tokenAgente, corpo));
        encerrar(tokenAgente, id, Map.of("providenciaTomada", "sem_acao")).then().statusCode(200);

        atualizar(tokenAgente, id, corpoPut(corpo)).then().statusCode(422);
        nota(tokenAgente, id, "depois do encerramento").then().statusCode(422);
        anexar(tokenAgente, id, "foto.png", PNG).then().statusCode(422);
        String processoId = criarProcesso(tokenAgente, false, null).path("id");
        vincular(tokenAgente, id, processoId).then().statusCode(422);
    }

    @Test
    @DisplayName("[D37] nota: Agente 200 e aparece na timeline sem mudar status; Vet 403; id inexistente 404")
    void notas() {
        String id = idDe(criar(tokenAgente, corpo()));

        Response resposta = nota(tokenAgente, id, "Liguei, ninguem atendeu");
        resposta.then().statusCode(200);
        assertThat(resposta.path("statusOcorrencia"), equalTo("ABERTA"));
        assertThat(resposta.path("movimentacoes[0].tipoMovimentacao"), equalTo("NOTA_INTERNA"));
        assertThat(resposta.path("movimentacoes[0].descricao"), equalTo("Liguei, ninguem atendeu"));
        assertThat(resposta.path("movimentacoes[0].statusNovo"), nullValue());

        nota(tokenAgente, id, "  ").then().statusCode(422);
        nota(tokenVet, id, "tentativa").then().statusCode(403);
        nota(tokenAgente, UUID.randomUUID().toString(), "x").then().statusCode(404);
    }

    // ── Processo vinculado (D12, D31, D33) ───────────────

    @Test
    @DisplayName("[D12] processo vinculado nao concluido bloqueia o encerramento; concluido libera")
    void encerramentoEsperaProcessoConcluir() {
        String id = idDe(criar(tokenAgente, corpo()));
        String processoId = criarProcesso(tokenAgente, false, id).path("id");
        alterarStatus(tokenAgente, id, "EM_ATENDIMENTO").then().statusCode(200);

        encerrar(tokenAgente, id, Map.of("providenciaTomada", "abertura_processo")).then().statusCode(422);

        for (String status : List.of("AGUARDANDO_RESULTADO", "COM_RESULTADO", "CONCLUIDO")) {
            alterarStatusProcesso(tokenAgente, processoId, status).then().statusCode(200);
        }
        encerrar(tokenAgente, id, Map.of("providenciaTomada", "abertura_processo")).then().statusCode(200);
    }

    @Test
    @DisplayName("[D33] Vet nao vincula: POST processo com ocorrenciaId 403 sem criar nada; sem ocorrenciaId 200")
    void vetNaoVinculaProcesso() {
        String id = idDe(criar(tokenAgente, corpo()));
        int processosAntes = contar("processo_sanitario");

        criarProcesso(tokenVet, true, id).then().statusCode(403);
        assertThat(contar("processo_sanitario"), equalTo(processosAntes));
        Response depois = detalhe(tokenAdmin, id);
        assertThat(depois.path("movimentacoes"), hasSize(1));
        assertThat(depois.path("urgente"), equalTo(false));
        assertThat(depois.path("processoVinculado"), nullValue());

        String processoSemVinculo = criarProcesso(tokenVet, false, null).then().statusCode(200).extract().path("id");
        vincular(tokenVet, id, processoSemVinculo).then().statusCode(403);

        criarProcesso(tokenAgente, false, id).then().statusCode(200);
    }

    @Test
    @DisplayName("[D2] ocorrencia ou processo ja vinculados: 409")
    void vinculoDuplicado() {
        String id = idDe(criar(tokenAgente, corpo()));
        criarProcesso(tokenAgente, false, id).then().statusCode(200);

        criarProcesso(tokenAgente, false, id).then().statusCode(409);
        String outroProcesso = criarProcesso(tokenAgente, false, null).path("id");
        vincular(tokenAgente, id, outroProcesso).then().statusCode(409);
    }

    @Test
    @DisplayName("[D31] urgencia do cadastro sobrevive ao vinculo; processo urgente marca; PUT nao desmarca o que o processo marcou")
    void urgencia() {
        Map<String, Object> urgente = corpo();
        urgente.put("urgente", true);
        String idUrgente = idDe(criar(tokenAgente, urgente));
        criarProcesso(tokenAgente, false, idUrgente).then().statusCode(200);
        assertThat(detalhe(tokenAgente, idUrgente).path("urgente"), equalTo(true));

        Map<String, Object> comum = corpo();
        String idComum = idDe(criar(tokenAgente, comum));
        criarProcesso(tokenAgente, true, idComum).then().statusCode(200);
        assertThat(detalhe(tokenAgente, idComum).path("urgente"), equalTo(true));

        Map<String, Object> desmarcar = corpoPut(comum);
        desmarcar.put("urgente", false);
        atualizar(tokenAgente, idComum, desmarcar).then().statusCode(422);

        Map<String, Object> semProcesso = corpo();
        semProcesso.put("urgente", true);
        String idSemProcesso = idDe(criar(tokenAgente, semProcesso));
        Map<String, Object> desmarcarSemProcesso = corpoPut(semProcesso);
        desmarcarSemProcesso.put("urgente", false);
        atualizar(tokenAgente, idSemProcesso, desmarcarSemProcesso).then().statusCode(200);
    }

    @Test
    @DisplayName("[D31] vinculo grava auditoria ATUALIZACAO com antes/depois da urgencia, nos dois caminhos")
    void vinculoGeraAuditoriaDeUrgencia() throws Exception {
        String peloProcesso = idDe(criar(tokenAgente, corpo()));
        criarProcesso(tokenAgente, true, peloProcesso).then().statusCode(200);

        String pelaOcorrencia = idDe(criar(tokenAgente, corpo()));
        String processoUrgente = criarProcesso(tokenAgente, true, null).path("id");
        vincular(tokenAgente, pelaOcorrencia, processoUrgente).then().statusCode(200);

        for (String id : List.of(peloProcesso, pelaOcorrencia)) {
            List<Map<String, Object>> eventos = jdbcTemplate.queryForList(
                    "SELECT CAST(payload_antes AS text) AS antes, CAST(payload_depois AS text) AS depois"
                            + " FROM auditoria_evento WHERE entidade = 'ocorrencia' AND acao = 'ATUALIZACAO'"
                            + " AND entidade_id = CAST(? AS uuid)", id);
            assertThat(eventos, hasSize(1));
            assertThat(objectMapper.readTree((String) eventos.get(0).get("antes")).get("urgente").asBoolean(), equalTo(false));
            assertThat(objectMapper.readTree((String) eventos.get(0).get("depois")).get("urgente").asBoolean(), equalTo(true));
        }
    }

    @Test
    @DisplayName("[D21] processo com dataAbertura futura: 422")
    void processoComDataFutura() {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        corpo.put("dataAbertura", HOJE.plusDays(1).toString());

        fixture.postarProcesso(tokenAgente, corpo).then().statusCode(422);
    }

    // ── Denuncia anonima (D32) ───────────────────────────

    @Test
    @DisplayName("[D32] anonima: sem denunciante passa; qualquer dado do denunciante 422; anonima e sigilosa 422")
    void denunciaAnonimaNoCadastro() {
        Map<String, Object> anonima = corpo();
        anonima.put("anonima", true);
        anonima.remove("denunciante");
        String id = idDe(criar(tokenAgente, anonima));
        assertThat(detalhe(tokenAdmin, id).path("denunciante"), nullValue());
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM denunciante WHERE ocorrencia_id = CAST(? AS uuid)",
                Integer.class, id), equalTo(0));

        Map<String, Object> soTelefone = corpo();
        soTelefone.put("anonima", true);
        soTelefone.put("denunciante", Map.of("telefone", "(11) 9 0000-0000"));
        criar(tokenAgente, soTelefone).then().statusCode(422);

        Map<String, Object> anonimaESigilosa = corpo();
        anonimaESigilosa.put("anonima", true);
        anonimaESigilosa.put("sigilosa", true);
        anonimaESigilosa.remove("denunciante");
        criar(tokenAgente, anonimaESigilosa).then().statusCode(422);
    }

    @Test
    @DisplayName("[D32] anonima -> identificada com o bloco: 200; sem o bloco: 422; identificada -> anonima: 422")
    void transicoesDeAnonimato() {
        Map<String, Object> anonima = corpo();
        anonima.put("anonima", true);
        anonima.remove("denunciante");
        String id = idDe(criar(tokenAgente, anonima));

        Map<String, Object> semBloco = corpoPut(anonima);
        semBloco.put("anonima", false);
        semBloco.remove("denunciante");
        atualizar(tokenAgente, id, semBloco).then().statusCode(422);

        Map<String, Object> identificada = corpoPut(anonima);
        identificada.put("anonima", false);
        identificada.put("denunciante", Map.of("nome", "Identificado Depois"));
        atualizar(tokenAgente, id, identificada).then().statusCode(200);
        assertThat(detalhe(tokenAdmin, id).path("denunciante.nome"), equalTo("Identificado Depois"));

        Map<String, Object> deVoltaAnonima = corpoPut(identificada);
        deVoltaAnonima.put("anonima", true);
        deVoltaAnonima.remove("denunciante");
        atualizar(tokenAgente, id, deVoltaAnonima).then().statusCode(422);
    }

    // ── Listagem (D31, D36) ──────────────────────────────

    @Test
    @DisplayName("[D31] listagem traz urgentes primeiro")
    void listagemComUrgentesPrimeiro() {
        String bairro = "Bairro" + UUID.randomUUID().toString().substring(0, 8);
        Map<String, Object> comum = corpo();
        comum.put("bairro", bairro);
        criar(tokenAgente, comum).then().statusCode(200);
        Map<String, Object> urgente = corpo();
        urgente.put("bairro", bairro);
        urgente.put("urgente", true);
        criar(tokenAgente, urgente).then().statusCode(200);

        Response lista = listar(tokenAgente, bairro);
        assertThat(lista.path("totalItens"), equalTo(2));
        assertThat(lista.path("itens[0].urgente"), equalTo(true));
        assertThat(lista.path("itens[1].urgente"), equalTo(false));
    }

    @Test
    @DisplayName("[D36] busca pelo protocolo com ou sem o prefixo OC")
    void buscaPorProtocoloComPrefixo() {
        Response criada = criar(tokenAgente, corpo());
        String id = idDe(criada);
        String protocolo = criada.path("protocolo");

        for (String q : List.of(protocolo, "OC " + protocolo, "oc" + protocolo)) {
            List<String> ids = listar(tokenAgente, q).path("itens.id");
            assertThat(q, ids, hasItem(id));
        }
    }

    // ── Anexos (D9, D20, D30) ────────────────────────────

    @Test
    @DisplayName("[D9] anexo: PNG 200; GIF 422; sexto anexo 422")
    void regrasDeAnexo() {
        String id = idDe(criar(tokenAgente, corpo()));

        Response anexo = anexar(tokenAgente, id, "foto.png", PNG);
        anexo.then().statusCode(200);
        assertThat(anexo.path("mimeType"), equalTo("image/png"));
        assertThat(anexo.path("tamanho"), equalTo(PNG.length));

        anexar(tokenAgente, id, "animado.gif", GIF).then().statusCode(422);

        for (int i = 2; i <= 5; i++) {
            anexar(tokenAgente, id, "foto" + i + ".png", PNG).then().statusCode(200);
        }
        anexar(tokenAgente, id, "foto6.png", PNG).then().statusCode(422);
        assertThat(detalhe(tokenLeitor, id).path("anexos"), hasSize(5));
    }

    @Test
    @DisplayName("[D9] anexo de exatamente 5 MB: 200; de 5 MB + 1 byte: 413 com ErroResponse")
    void limiteDeTamanhoDoAnexo() {
        String id = idDe(criar(tokenAgente, corpo()));

        anexar(tokenAgente, id, "limite.png", pngComTamanho(5 * 1024 * 1024)).then().statusCode(200);

        Response acima = anexar(tokenAgente, id, "grande.png", pngComTamanho(5 * 1024 * 1024 + 1));
        acima.then().statusCode(413);
        assertThat(acima.path("mensagem"), equalTo("Arquivo excede o tamanho maximo de 5 MB"));
        assertThat(detalhe(tokenAgente, id).path("anexos"), hasSize(1));
    }

    @Test
    @DisplayName("[D30] download em sigilosa: Admin e Agente 200, leitor sem a feature 403; troca de sigilo vale na hora;"
            + " Vet 403 sempre (V11)")
    void downloadDeAnexoPorSigilo() {
        Map<String, Object> corpo = corpo();
        String id = idDe(criar(tokenAgente, corpo));
        String anexoId = anexar(tokenAgente, id, "foto.png", PNG).path("id");

        baixar(tokenLeitor, id, anexoId).then().statusCode(200);
        baixar(tokenVet, id, anexoId).then().statusCode(403);

        Map<String, Object> sigilosa = corpoPut(corpo);
        sigilosa.put("sigilosa", true);
        atualizar(tokenAdmin, id, sigilosa).then().statusCode(200);

        baixar(tokenAdmin, id, anexoId).then().statusCode(200);
        baixar(tokenAgente, id, anexoId).then().statusCode(200);
        baixar(tokenLeitor, id, anexoId).then().statusCode(403);
        assertThat(detalhe(tokenLeitor, id).path("anexos"), hasSize(1));

        Map<String, Object> publica = corpoPut(corpo);
        publica.put("sigilosa", false);
        atualizar(tokenAgente, id, publica).then().statusCode(200);
        baixar(tokenLeitor, id, anexoId).then().statusCode(200);
    }

    @Test
    @DisplayName("[D9] download devolve o conteudo e o tipo gravados")
    void downloadDevolveConteudo() {
        String id = idDe(criar(tokenAgente, corpo()));
        String anexoId = anexar(tokenAgente, id, "foto.png", PNG).path("id");

        Response download = baixar(tokenAgente, id, anexoId);
        download.then().statusCode(200).contentType("image/png");
        assertThat(download.asByteArray(), equalTo(PNG));
        given().header("Authorization", "Bearer " + tokenAgente)
                .when().get(ROTA + "/" + UUID.randomUUID() + "/anexos/" + anexoId).then().statusCode(404);
    }

    // ── Auditoria (D23) ──────────────────────────────────

    @Test
    @DisplayName("[D23] snapshot de auditoria sem dados do denunciante e com o endereco da ocorrencia")
    void auditoriaSemDadosDoDenunciante() {
        String marcador = UUID.randomUUID().toString().substring(0, 8);
        Map<String, Object> corpo = corpo();
        corpo.put("endereco", "Rua da Ocorrencia " + marcador);
        corpo.put("bairro", "BairroOcorrencia" + marcador);
        corpo.put("denunciante", Map.of(
                "nome", "Nome Pessoal " + marcador,
                "cpf", "987.654.321-00",
                "telefone", "(11) 9 8888-" + marcador.substring(0, 4),
                "email", "pessoal" + marcador + "@email.com",
                "cep", "13300-111",
                "endereco", "Rua do Denunciante " + marcador,
                "bairroResidencial", "BairroResidencial" + marcador));
        String id = idDe(criar(tokenAgente, corpo));
        Map<String, Object> put = corpoPut(corpo);
        put.put("denunciante", Map.of("nome", "Outro Nome " + marcador));
        atualizar(tokenAgente, id, put).then().statusCode(200);

        List<Map<String, Object>> eventos = jdbcTemplate.queryForList(
                "SELECT acao, CAST(payload_antes AS text) AS antes, CAST(payload_depois AS text) AS depois"
                        + " FROM auditoria_evento WHERE entidade = 'ocorrencia' AND entidade_id = CAST(? AS uuid)"
                        + " ORDER BY ocorreu_em", id);
        assertThat(eventos, hasSize(2));

        for (Map<String, Object> evento : eventos) {
            for (String payload : new String[] {(String) evento.get("antes"), (String) evento.get("depois")}) {
                if (payload == null) {
                    continue;
                }
                for (String pessoal : List.of("Nome Pessoal", "Outro Nome", "987.654.321-00", "pessoal" + marcador,
                        "13300-111", "Rua do Denunciante", "BairroResidencial")) {
                    assertThat(payload, not(containsString(pessoal)));
                }
            }
        }
        // O endereco e o bairro DA OCORRENCIA continuam no snapshot (D27);
        // o que sai sao so os dados pessoais do denunciante.
        JsonNode depoisDoPut = objectMapper.readTree((String) eventos.get(1).get("depois"));
        assertThat(depoisDoPut.has("denunciante"), equalTo(false));
        assertThat(depoisDoPut.get("endereco").asString(), equalTo("Rua da Ocorrencia " + marcador));
        assertThat(depoisDoPut.get("bairro").asString(), equalTo("BairroOcorrencia" + marcador));
        assertThat(depoisDoPut.get("denuncianteAlterado").asBoolean(), equalTo(true));
        assertThat(objectMapper.readTree((String) eventos.get(0).get("depois")).get("denuncianteAlterado").asBoolean(),
                equalTo(true));
    }

    // ── Apoio ────────────────────────────────────────────

    private Map<String, Object> corpo() {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "zoonose");
        corpo.put("dataAbertura", HOJE.toString());
        corpo.put("horaAbertura", "10:30:00");
        corpo.put("endereco", "Rua das Acacias, 145");
        corpo.put("bairro", "Vila Esperanca");
        corpo.put("descricao", "Cao com salivacao excessiva");
        corpo.put("urgente", false);
        corpo.put("sigilosa", false);
        corpo.put("anonima", false);
        corpo.put("denunciante", Map.of("nome", "Maria Teste"));
        return corpo;
    }

    // PUT exige as flags explicitas (D10); parte do corpo usado no cadastro.
    private static Map<String, Object> corpoPut(Map<String, Object> base) {
        return new HashMap<>(base);
    }

    private Response criar(String token, Map<String, Object> corpo) {
        return comToken(token).contentType(ContentType.JSON).body(corpo).when().post(ROTA);
    }

    private Response atualizar(String token, String id, Map<String, Object> corpo) {
        return comToken(token).contentType(ContentType.JSON).body(corpo).when().put(ROTA + "/" + id);
    }

    private Response detalhe(String token, String id) {
        Response resposta = comToken(token).when().get(ROTA + "/" + id);
        resposta.then().statusCode(200);
        return resposta;
    }

    private Response listar(String token, String q) {
        Response resposta = comToken(token).queryParam("q", q).queryParam("tamanho", 50).when().get(ROTA);
        resposta.then().statusCode(200);
        return resposta;
    }

    private Response alterarStatus(String token, String id, String status) {
        return comToken(token).contentType(ContentType.JSON).body(Map.of("status", status))
                .when().patch(ROTA + "/" + id + "/status");
    }

    private Response encerrar(String token, String id, Map<String, Object> corpo) {
        return comToken(token).contentType(ContentType.JSON).body(corpo).when().post(ROTA + "/" + id + "/encerramento");
    }

    private Response nota(String token, String id, String descricao) {
        return comToken(token).contentType(ContentType.JSON).body(Map.of("descricao", descricao))
                .when().post(ROTA + "/" + id + "/notas");
    }

    private Response vincular(String token, String id, String processoId) {
        return comToken(token).contentType(ContentType.JSON).body(Map.of("processoId", processoId))
                .when().post(ROTA + "/" + id + "/processo");
    }

    private Response anexar(String token, String id, String nome, byte[] conteudo) {
        return comToken(token).multiPart("arquivo", nome, conteudo, "application/octet-stream")
                .when().post(ROTA + "/" + id + "/anexos");
    }

    private Response baixar(String token, String id, String anexoId) {
        return comToken(token).when().get(ROTA + "/" + id + "/anexos/" + anexoId);
    }

    // Processo urgente = amostra com contato humano (DER regra 18, T29).
    private Response criarProcesso(String token, boolean urgente, String ocorrenciaId) {
        return fixture.postarProcesso(token, ocorrenciaId, urgente);
    }

    private Response alterarStatusProcesso(String token, String processoId, String status) {
        return comToken(token).contentType(ContentType.JSON).body(Map.of("status", status))
                .when().patch("/api/processos/" + processoId + "/status");
    }

    private RequestSpecification comToken(String token) {
        return given().header("Authorization", "Bearer " + token);
    }

    private int contar(String tabela) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + tabela, Integer.class);
    }

    private static byte[] pngComTamanho(int tamanho) {
        byte[] conteudo = new byte[tamanho];
        System.arraycopy(PNG, 0, conteudo, 0, PNG.length);
        return conteudo;
    }

    private static String idDe(Response resposta) {
        resposta.then().statusCode(200);
        return resposta.path("id");
    }
}
