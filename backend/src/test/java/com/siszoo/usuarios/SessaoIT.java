package com.siszoo.usuarios;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;
import com.siszoo.usuarios.dto.AtualizarStatusUsuarioRequest;
import com.siszoo.usuarios.dto.TrocarSenhaRequest;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.AuditoriaEvento;
import com.siszoo.usuarios.entity.MotivoEncerramentoSessao;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.AuditoriaEventoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

@Import(RelogioTesteConfig.class)
class SessaoIT extends AbstractIntegrationTest {

    private static final String COOKIE = "siszoo_sessao";
    private static final String CABECALHO = "X-SISZOO-Sessao";
    private static final String SENHA = "SenhaTeste123";
    private static final String ROTA_PROTEGIDA = "/api/usuarios/me";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuditoriaEventoRepository auditoriaRepository;

    @AfterEach
    void restaurarRelogio() {
        RelogioTesteConfig.restaurar();
    }

    private record Sessao(String email, String token, String cookie) {
    }

    private Sessao entrar() {
        String email = "sessao." + UUID.randomUUID().toString().replaceAll("[^a-z]", "") + "x@itu.sp.gov.br";
        fixture.tokenAdmin(email, "Sessao");
        return login(email);
    }

    private Sessao login(String email) {
        Response resposta = given().contentType(ContentType.JSON)
                .body(Map.of("email", email, "senha", SENHA))
                .post("/api/auth/login");
        resposta.then().statusCode(200);
        return new Sessao(email, resposta.path("token"), resposta.getCookie(COOKIE));
    }

    private static Response renovar(String cookie, boolean houveAtividade) {
        return given().contentType(ContentType.JSON).header(CABECALHO, "1").cookie(COOKIE, cookie)
                .body(Map.of("houveAtividade", houveAtividade))
                .post("/api/auth/renovar");
    }

    private static Response logout(String cookie) {
        return given().header(CABECALHO, "1").cookie(COOKIE, cookie).post("/api/auth/logout");
    }

    private static int statusProtegida(String token) {
        return given().header("Authorization", "Bearer " + token).get(ROTA_PROTEGIDA).statusCode();
    }

    @Test
    @DisplayName("login: cookie httpOnly, restrito a /api/auth, e o token de renovacao fora do corpo")
    void loginGravaCookieSeguro() {
        String email = "sessao.cookie@itu.sp.gov.br";
        fixture.tokenAdmin(email, "Cookie");

        Response resposta = given().contentType(ContentType.JSON)
                .body(Map.of("email", email, "senha", SENHA))
                .post("/api/auth/login");

        String setCookie = resposta.getHeader("Set-Cookie");
        assertThat(setCookie, containsString("HttpOnly"));
        assertThat(setCookie, containsString("SameSite=Strict"));
        assertThat(setCookie, containsString("Path=/api/auth"));
        assertThat(setCookie, not(containsString("Max-Age")));
        assertThat(resposta.asString(), not(containsString(resposta.getCookie(COOKIE))));
    }

    @Test
    @DisplayName("login grava o ultimo acesso")
    void loginGravaUltimoAcesso() {
        Sessao sessao = entrar();
        assertThat(usuarioRepository.findByEmail(sessao.email()).orElseThrow().getUltimoAcesso(), notNullValue());
    }

    @Test
    @DisplayName("renovar responde como o login: token de acesso novo e usuario")
    void renovarDevolveTokenEUsuario() {
        Sessao sessao = entrar();

        Response resposta = renovar(sessao.cookie(), true);

        resposta.then().statusCode(200).body("usuario.email", equalTo(sessao.email()));
        assertThat(statusProtegida(resposta.path("token")), equalTo(200));
    }

    @Test
    @DisplayName("renovar e logout sem o header proprio: 403, para outra origem nao dispara com o cookie")
    void semCabecalhoRecusa() {
        Sessao sessao = entrar();

        given().contentType(ContentType.JSON).body("{}").cookie(COOKIE, sessao.cookie())
                .post("/api/auth/renovar").then().statusCode(403);
        given().cookie(COOKIE, sessao.cookie()).post("/api/auth/logout").then().statusCode(403);
        assertThat(statusProtegida(sessao.token()), equalTo(200));
    }

    @Test
    @DisplayName("renovar sem cookie ou com cookie desconhecido: 401")
    void semCookieRecusa() {
        given().header(CABECALHO, "1").post("/api/auth/renovar").then().statusCode(401);
        renovar("token-que-nunca-existiu", true).then().statusCode(401);
    }

    @Test
    @DisplayName("com atividade a sessao continua valida muito alem de 60 minutos")
    void renovacaoDeslizaAJanela() {
        Sessao sessao = entrar();

        for (int rodada = 0; rodada < 4; rodada++) {
            RelogioTesteConfig.avancar(Duration.ofMinutes(50));
            Response resposta = renovar(sessao.cookie(), true);
            resposta.then().statusCode(200);
            String novoCookie = resposta.getCookie(COOKIE);
            sessao = new Sessao(sessao.email(), resposta.path("token"), novoCookie != null ? novoCookie : sessao.cookie());
        }

        assertThat(statusProtegida(sessao.token()), equalTo(200));
    }

    @Test
    @DisplayName("exatamente aos 60 minutos ainda renova; depois disso expira e a sessao fica encerrada")
    void expiraDepoisDeSessentaMinutosSemAtividade() {
        Sessao sessao = entrar();

        RelogioTesteConfig.avancar(Duration.ofMinutes(60));
        renovar(sessao.cookie(), false).then().statusCode(200);

        RelogioTesteConfig.avancar(Duration.ofMinutes(1));
        renovar(sessao.cookie(), true).then().statusCode(401);

        assertThat(jdbcTemplate.queryForList("""
                select s.motivo_encerramento from sessao_usuario s join usuario u on u.id = s.usuario_id
                where u.email = ?
                """, String.class, sessao.email()), hasItem(MotivoEncerramentoSessao.INATIVIDADE.name()));
    }

    @Test
    @DisplayName("renovacao sem atividade nao prolonga a sessao abandonada")
    void renovacaoSemAtividadeNaoDesliza() {
        Sessao sessao = entrar();

        RelogioTesteConfig.avancar(Duration.ofMinutes(40));
        renovar(sessao.cookie(), false).then().statusCode(200);
        RelogioTesteConfig.avancar(Duration.ofMinutes(40));

        renovar(sessao.cookie(), false).then().statusCode(401);
    }

    @Test
    @DisplayName("token de acesso ainda dentro da validade para de valer quando a sessao vence por inatividade")
    void tokenDeAcessoCaiComASessao() {
        Sessao sessao = entrar();
        RelogioTesteConfig.avancar(Duration.ofMinutes(59));
        String tokenRecente = renovar(sessao.cookie(), false).path("token");

        assertThat(statusProtegida(tokenRecente), equalTo(200));
        RelogioTesteConfig.avancar(Duration.ofMinutes(2));

        assertThat(statusProtegida(tokenRecente), equalTo(401));
    }

    @Test
    @DisplayName("token de acesso vencido responde 401, mas a sessao segue renovavel")
    void tokenExpiradoNaoDerrubaASessao() {
        Sessao sessao = entrar();

        RelogioTesteConfig.avancar(Duration.ofMinutes(16));

        assertThat(statusProtegida(sessao.token()), equalTo(401));
        renovar(sessao.cookie(), true).then().statusCode(200);
    }

    @Test
    @DisplayName("logout encerra na hora, audita e apaga o cookie")
    void logoutEncerraASessao() {
        Sessao sessao = entrar();

        Response resposta = logout(sessao.cookie());

        resposta.then().statusCode(204);
        assertThat(resposta.getHeader("Set-Cookie"), containsString("Max-Age=0"));
        assertThat(statusProtegida(sessao.token()), equalTo(401));
        renovar(sessao.cookie(), true).then().statusCode(401);
        assertThat(acoesDe(usuario(sessao).getId()), hasItem(AcaoAuditoria.LOGOUT));
    }

    @Test
    @DisplayName("logout sem cookie nao falha")
    void logoutSemCookie() {
        given().header(CABECALHO, "1").post("/api/auth/logout").then().statusCode(204);
    }

    @Test
    @DisplayName("token rotacionado: aceito na tolerancia, sem novo cookie; depois disso e reuso e revoga a sessao")
    void reusoDoTokenAntigoRevogaASessao() {
        Sessao sessao = entrar();
        RelogioTesteConfig.avancar(Duration.ofMinutes(6));
        Response rotacao = renovar(sessao.cookie(), true);
        String cookieNovo = rotacao.getCookie(COOKIE);
        assertThat(cookieNovo, notNullValue());
        assertThat(cookieNovo, not(equalTo(sessao.cookie())));

        RelogioTesteConfig.avancar(Duration.ofSeconds(30));
        Response dentroDaTolerancia = renovar(sessao.cookie(), true);
        dentroDaTolerancia.then().statusCode(200);
        assertThat(dentroDaTolerancia.getCookie(COOKIE), nullValue());

        RelogioTesteConfig.avancar(Duration.ofSeconds(31));
        renovar(sessao.cookie(), true).then().statusCode(401);

        renovar(cookieNovo, true).then().statusCode(401);
        assertThat(statusProtegida(rotacao.path("token")), equalTo(401));
        assertThat(eventosDe(usuario(sessao).getId(), AcaoAuditoria.SESSAO_REVOGADA), equalTo(1L));
    }

    @Test
    @DisplayName("dentro do intervalo de rotacao, renovar nao troca o cookie")
    void semRotacaoAntesDoIntervalo() {
        Sessao sessao = entrar();
        RelogioTesteConfig.avancar(Duration.ofMinutes(2));

        Response resposta = renovar(sessao.cookie(), true);

        resposta.then().statusCode(200);
        assertThat(resposta.getCookie(COOKIE), nullValue());
    }

    @Test
    @DisplayName("renovacoes simultaneas do mesmo token: todas passam e so uma rotaciona")
    void renovacoesSimultaneas() throws Exception {
        Sessao sessao = entrar();
        RelogioTesteConfig.avancar(Duration.ofMinutes(6));

        int concorrentes = 8;
        CountDownLatch largada = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(concorrentes);
        List<Future<Response>> futuros = new ArrayList<>();
        for (int i = 0; i < concorrentes; i++) {
            Callable<Response> tarefa = () -> {
                largada.await();
                return renovar(sessao.cookie(), true);
            };
            futuros.add(executor.submit(tarefa));
        }
        largada.countDown();

        int cookiesNovos = 0;
        for (Future<Response> futuro : futuros) {
            Response resposta = futuro.get();
            assertThat(resposta.statusCode(), equalTo(200));
            if (resposta.getCookie(COOKIE) != null) {
                cookiesNovos++;
            }
        }
        executor.shutdown();

        assertThat(cookiesNovos, equalTo(1));
        assertThat(statusProtegida(sessao.token()), equalTo(200));
    }

    @Test
    @DisplayName("trocar a senha encerra as outras sessoes e mantem a atual")
    void trocarSenhaRevogaAsOutrasSessoes() {
        Sessao atual = entrar();
        Sessao outra = login(atual.email());

        given().header("Authorization", "Bearer " + atual.token()).contentType(ContentType.JSON)
                .body(new TrocarSenhaRequest("Nova!Senha#2026", "Nova!Senha#2026"))
                .post("/api/auth/senha")
                .then().statusCode(204);

        assertThat(statusProtegida(atual.token()), equalTo(200));
        assertThat(statusProtegida(outra.token()), equalTo(401));
        renovar(outra.cookie(), true).then().statusCode(401);
    }

    @Test
    @DisplayName("desativar pela API encerra as sessoes: reativar nao ressuscita o token antigo")
    void desativarRevogaSessoes() {
        Sessao alvo = entrar();
        String admin = fixture.tokenAdmin("sessao.admin@itu.sp.gov.br", "Admin");
        UUID id = usuario(alvo).getId();

        alterarStatus(admin, id, false);
        assertThat(statusProtegida(alvo.token()), equalTo(401));

        alterarStatus(admin, id, true);
        assertThat(statusProtegida(alvo.token()), equalTo(401));
        renovar(alvo.cookie(), true).then().statusCode(401);
    }

    @Test
    @DisplayName("sessao de um usuario desativado direto no banco recusa a renovacao")
    void usuarioInativoNaoRenova() {
        Sessao sessao = entrar();
        Usuario usuario = usuario(sessao);
        usuario.setAtivo(false);
        usuarioRepository.save(usuario);

        renovar(sessao.cookie(), true).then().statusCode(401);
    }

    @Test
    @DisplayName("CORS: a origem do front passa com credenciais e o header proprio; outra origem nao")
    void corsDaRenovacao() {
        given().header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", CABECALHO)
                .options("/api/auth/renovar")
                .then().statusCode(200)
                .header("Access-Control-Allow-Credentials", "true")
                .header("Access-Control-Allow-Origin", "http://localhost:5173");

        given().header("Origin", "https://site-malicioso.example")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", CABECALHO)
                .options("/api/auth/renovar")
                .then().statusCode(403);

        Sessao sessao = entrar();
        given().header("Origin", "https://site-malicioso.example").header(CABECALHO, "1")
                .cookie(COOKIE, sessao.cookie())
                .post("/api/auth/renovar")
                .then().statusCode(403);
    }

    private void alterarStatus(String token, UUID id, boolean ativo) {
        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(new AtualizarStatusUsuarioRequest(ativo))
                .patch("/api/usuarios/" + id + "/status")
                .then().statusCode(200);
    }

    private Usuario usuario(Sessao sessao) {
        return usuarioRepository.findByEmail(sessao.email()).orElseThrow();
    }

    private List<AcaoAuditoria> acoesDe(UUID usuarioId) {
        return auditoriaRepository.findAll().stream()
                .filter(evento -> evento.getUsuario() != null && usuarioId.equals(evento.getUsuario().getId()))
                .map(AuditoriaEvento::getAcao)
                .toList();
    }

    private long eventosDe(UUID usuarioId, AcaoAuditoria acao) {
        return acoesDe(usuarioId).stream().filter(acao::equals).count();
    }
}
