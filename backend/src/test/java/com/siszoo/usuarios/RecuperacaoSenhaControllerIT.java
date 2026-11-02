package com.siszoo.usuarios;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.arrayWithSize;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.AuditoriaEvento;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.AuditoriaEventoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.mail.Message;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;

class RecuperacaoSenhaControllerIT extends AbstractIntegrationTest {

    @RegisterExtension
    static final GreenMailExtension GREEN_MAIL = new GreenMailExtension(ServerSetupTest.SMTP.dynamicPort())
            .withConfiguration(GreenMailConfiguration.aConfig().withDisabledAuthentication())
            .withPerMethodLifecycle(false);

    @DynamicPropertySource
    static void smtpDoGreenMail(DynamicPropertyRegistry registro) {
        registro.add("spring.mail.host", () -> GREEN_MAIL.getSmtp().getBindTo());
        registro.add("spring.mail.port", () -> GREEN_MAIL.getSmtp().getPort());
        registro.add("siszoo.recuperacao-senha.limite.solicitacoes-por-ip", () -> 1000);
        registro.add("siszoo.recuperacao-senha.limite.consumos-por-ip", () -> 1000);
    }

    private static final String SENHA_ATUAL = "SenhaTeste123";
    private static final String SENHA_NOVA = "Outra-Senha-2026";
    private static final String ROTA_PROTEGIDA = "/api/usuarios/me";
    private static final long ESPERA_MS = 5000;
    private static final Pattern LINK = Pattern.compile("http://localhost:5173/redefinir-senha\\?token=([A-Za-z0-9_-]+)");

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AuditoriaEventoRepository auditoriaEventoRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void limparCaixa() throws Exception {
        GREEN_MAIL.purgeEmailFromAllMailboxes();
    }

    private record Conta(String email, String tokenSessao) {
    }

    private Conta contaAtiva() {
        String email = "recupera." + UUID.randomUUID().toString().replaceAll("[^a-z]", "") + "x@itu.sp.gov.br";
        return new Conta(email, fixture.tokenAdmin(email, "Recuperacao"));
    }

    @Test
    @DisplayName("solicitacao com conta ativa: e-mail chega com link, o link redefine a senha uma unica vez e derruba as sessoes")
    void fluxoCompleto() throws Exception {
        Conta conta = contaAtiva();

        solicitar(conta.email()).then().statusCode(202);

        MimeMessage mensagem = unicaMensagemRecebida();
        assertThat(mensagem.getSubject(), equalTo("SISZOO - Redefinição de senha"));
        assertThat(((InternetAddress) mensagem.getRecipients(Message.RecipientType.TO)[0]).getAddress(),
                equalTo(conta.email()));
        MimeMultipart partes = (MimeMultipart) mensagem.getContent();
        String texto = (String) partes.getBodyPart(0).getContent();
        String html = (String) partes.getBodyPart(1).getContent();
        assertThat(texto, containsString("30 minutos"));
        assertThat(html, containsString("Redefinir minha senha"));
        assertThat(html, containsString("Se você não pediu a redefinição"));
        String token = tokenDoLink(texto);
        assertThat(tokenDoLink(html), equalTo(token));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM token_recuperacao_senha WHERE token_hash = ?",
                Integer.class, token), equalTo(0));

        validar(token).then().statusCode(204);
        redefinir(token, SENHA_NOVA, SENHA_NOVA).then().statusCode(204);

        login(conta.email(), SENHA_NOVA).then().statusCode(200).body("usuario.senhaAlteradaEm", not(equalTo(null)));
        login(conta.email(), SENHA_ATUAL).then().statusCode(401);
        given().header("Authorization", "Bearer " + conta.tokenSessao()).get(ROTA_PROTEGIDA).then().statusCode(401);

        validar(token).then().statusCode(410);
        redefinir(token, "Terceira-Senha-2026", "Terceira-Senha-2026").then().statusCode(410);

        Usuario usuario = usuarioRepository.findByEmail(conta.email()).orElseThrow();
        List<String> payloads = auditoriaEventoRepository.findAll().stream()
                .filter(evento -> usuario.getId().equals(evento.getEntidadeId()))
                .filter(evento -> evento.getAcao() == AcaoAuditoria.ATUALIZACAO)
                .map(AuditoriaEvento::getPayloadDepois)
                .toList();
        assertThat(payloads, hasItem(containsString("\"recuperacaoPorEmail\": true")));
        assertThat(String.join(" ", payloads), not(containsString(SENHA_NOVA)));
    }

    @Test
    @DisplayName("e-mail sem conta, conta desativada e formato invalido: mesma resposta publica e nenhum e-mail")
    void semEnumeracaoDeContas() throws Exception {
        solicitar("ninguem.inexistente@itu.sp.gov.br").then().statusCode(202);

        Conta desativada = contaAtiva();
        Usuario usuario = usuarioRepository.findByEmail(desativada.email()).orElseThrow();
        usuario.setAtivo(false);
        usuarioRepository.save(usuario);
        solicitar(desativada.email()).then().statusCode(202);

        assertThat(GREEN_MAIL.waitForIncomingEmail(1000, 1), is(false));
        assertThat(GREEN_MAIL.getReceivedMessages(), arrayWithSize(0));

        solicitar("fulano@gmail.com").then().statusCode(422).body("campos[0].campo", equalTo("email"));
    }

    @Test
    @DisplayName("token desconhecido ou vencido: 410 na validacao e na redefinicao, sem mudar a senha")
    void tokenInvalidoOuVencido() throws Exception {
        validar("nao-existe").then().statusCode(410)
                .body("mensagem", startsWith("Este link de redefinição de senha é inválido ou já expirou"));
        redefinir("nao-existe", SENHA_NOVA, SENHA_NOVA).then().statusCode(410);

        Conta conta = contaAtiva();
        String token = tokenDoLink(solicitarEReceber(conta.email()));
        jdbcTemplate.update("UPDATE token_recuperacao_senha SET expira_em = expira_em - interval '31 minutes'"
                + " WHERE usuario_id = (SELECT id FROM usuario WHERE email = ?)", conta.email());

        validar(token).then().statusCode(410);
        redefinir(token, SENHA_NOVA, SENHA_NOVA).then().statusCode(410);
        login(conta.email(), SENHA_ATUAL).then().statusCode(200);
    }

    @Test
    @DisplayName("novo pedido invalida o link anterior; trocar a senha logado invalida o link pendente")
    void linkAnteriorDeixaDeValer() throws Exception {
        Conta conta = contaAtiva();
        String primeiro = tokenDoLink(solicitarEReceber(conta.email()));
        GREEN_MAIL.purgeEmailFromAllMailboxes();
        String segundo = tokenDoLink(solicitarEReceber(conta.email()));

        validar(primeiro).then().statusCode(410);
        validar(segundo).then().statusCode(204);

        given().contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + conta.tokenSessao())
                .body(Map.of("novaSenha", SENHA_NOVA, "confirmarSenha", SENHA_NOVA))
                .post("/api/auth/senha")
                .then().statusCode(204);

        validar(segundo).then().statusCode(410);
    }

    @Test
    @DisplayName("redefinicao aplica a politica de senha, a confirmacao e a senha diferente da atual")
    void regrasDaSenhaNova() throws Exception {
        Conta conta = contaAtiva();
        String token = tokenDoLink(solicitarEReceber(conta.email()));

        redefinir(token, "Senha-Boa-2026", "Senha-Diferente-2026").then().statusCode(422)
                .body("mensagem", equalTo("A nova senha e a confirmação não são iguais."));
        redefinir(token, "somenteminusculas", "somenteminusculas").then().statusCode(422)
                .body("campos[0].campo", equalTo("novaSenha"));
        redefinir(token, "curta", "curta").then().statusCode(422)
                .body("campos[0].campo", equalTo("novaSenha"));
        redefinir(token, SENHA_ATUAL, SENHA_ATUAL).then().statusCode(422)
                .body("campos[0].mensagem", equalTo("A nova senha precisa ser diferente da senha atual."));

        redefinir(token, SENHA_NOVA, SENHA_NOVA).then().statusCode(204);
        login(conta.email(), SENHA_NOVA).then().statusCode(200);
    }

    @Test
    @DisplayName("quarta solicitacao do mesmo e-mail na janela recebe 429 e nao envia e-mail")
    void limitePorEmail() throws Exception {
        Conta conta = contaAtiva();
        for (int i = 0; i < 3; i++) {
            solicitar(conta.email()).then().statusCode(202);
        }
        assertThat(GREEN_MAIL.waitForIncomingEmail(ESPERA_MS, 3), is(true));

        solicitar(conta.email()).then().statusCode(429)
                .body("mensagem", startsWith("Muitas tentativas em pouco tempo"));
        assertThat(GREEN_MAIL.waitForIncomingEmail(1000, 4), is(false));
    }

    @Test
    @DisplayName("os endpoints de recuperacao nao exigem sessao e ignoram um Bearer invalido")
    void endpointsPublicos() {
        given().contentType(ContentType.JSON)
                .header("Authorization", "Bearer token-invalido")
                .body(Map.of("token", "qualquer"))
                .post("/api/auth/recuperacao/validar")
                .then().statusCode(410);
    }

    private static Response solicitar(String email) {
        return given().contentType(ContentType.JSON).body(Map.of("email", email)).post("/api/auth/recuperacao");
    }

    private static Response validar(String token) {
        return given().contentType(ContentType.JSON).body(Map.of("token", token)).post("/api/auth/recuperacao/validar");
    }

    private static Response redefinir(String token, String novaSenha, String confirmarSenha) {
        return given().contentType(ContentType.JSON)
                .body(Map.of("token", token, "novaSenha", novaSenha, "confirmarSenha", confirmarSenha))
                .post("/api/auth/recuperacao/redefinir");
    }

    private static Response login(String email, String senha) {
        return given().contentType(ContentType.JSON).body(Map.of("email", email, "senha", senha)).post("/api/auth/login");
    }

    private String solicitarEReceber(String email) throws Exception {
        solicitar(email).then().statusCode(202);
        MimeMultipart partes = (MimeMultipart) unicaMensagemRecebida().getContent();
        return (String) partes.getBodyPart(0).getContent();
    }

    private static MimeMessage unicaMensagemRecebida() {
        assertThat(GREEN_MAIL.waitForIncomingEmail(ESPERA_MS, 1), is(true));
        MimeMessage[] recebidas = GREEN_MAIL.getReceivedMessages();
        assertThat(recebidas, arrayWithSize(1));
        return recebidas[0];
    }

    private static String tokenDoLink(String corpo) {
        Matcher matcher = LINK.matcher(corpo);
        assertThat("link de redefinicao no corpo do e-mail", matcher.find(), is(true));
        return matcher.group(1);
    }
}
