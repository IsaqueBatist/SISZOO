package com.siszoo.usuarios.service;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.siszoo.comum.exception.CampoInvalidoException;
import com.siszoo.comum.service.EmailService;
import com.siszoo.comum.service.EmailTemplateService;
import com.siszoo.usuarios.dto.RedefinirSenhaComTokenRequest;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.MotivoEncerramentoSessao;
import com.siszoo.usuarios.entity.TokenRecuperacaoSenha;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.SenhasDivergentesException;
import com.siszoo.usuarios.exception.TokenRecuperacaoInvalidoException;
import com.siszoo.usuarios.repository.TokenRecuperacaoSenhaRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

// Regras do RecuperacaoSenhaService sem banco nem SMTP. O fluxo completo pela
// API e o e-mail real ficam em RecuperacaoSenhaControllerIT.
@ExtendWith(MockitoExtension.class)
class RecuperacaoSenhaServiceTest {

    private static final Clock RELOGIO = Clock.fixed(Instant.parse("2026-09-10T15:00:00Z"), ZoneId.of("America/Sao_Paulo"));
    private static final LocalDateTime AGORA = LocalDateTime.now(RELOGIO);
    private static final String EMAIL = "maria.silva@itu.sp.gov.br";

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private TokenRecuperacaoSenhaRepository tokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private EmailService emailService;
    @Mock
    private EmailTemplateService emailTemplateService;
    @Mock
    private SessaoService sessaoService;
    @Mock
    private AuditoriaEventoService auditoriaEventoService;
    @Mock
    private LimitadorRecuperacaoSenha limitador;

    private RecuperacaoSenhaService service;
    private Usuario usuario;

    @BeforeEach
    void preparar() {
        service = new RecuperacaoSenhaService(usuarioRepository, tokenRepository, passwordEncoder, emailService,
                emailTemplateService, sessaoService, auditoriaEventoService, limitador, RELOGIO,
                "https://siszoo.itu.sp.gov.br/", 30);
        usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setEmail(EMAIL);
        usuario.setNome("Maria");
        usuario.setSobrenome("Silva");
        usuario.setSenha("hash-atual");
    }

    @Test
    void solicitacaoSemContaAtivaNaoGravaNemEnvia() {
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        service.solicitar(EMAIL, "10.0.0.1");

        verify(limitador).registrarSolicitacao(EMAIL, "10.0.0.1");
        verifyNoInteractions(tokenRepository, emailService, emailTemplateService);
    }

    @Test
    void solicitacaoDeContaDesativadaNaoGravaNemEnvia() {
        usuario.setAtivo(false);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));

        service.solicitar(EMAIL, "10.0.0.1");

        verifyNoInteractions(tokenRepository, emailService);
    }

    @Test
    void solicitacaoGravaSoOHashEEnviaOLinkComOToken() {
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));
        when(emailTemplateService.renderizarHtml(anyString(), any())).thenReturn("<html>");
        when(emailTemplateService.renderizarTexto(anyString(), any())).thenReturn("texto");
        when(emailService.enviar(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.completedFuture(null));

        service.solicitar(" Maria.Silva@itu.sp.gov.br ", "10.0.0.1");

        verify(tokenRepository).invalidarPendentesDoUsuario(usuario.getId(), AGORA);
        ArgumentCaptor<TokenRecuperacaoSenha> gravado = ArgumentCaptor.forClass(TokenRecuperacaoSenha.class);
        verify(tokenRepository).save(gravado.capture());
        assertThat(gravado.getValue().getExpiraEm(), equalTo(AGORA.plusMinutes(30)));
        assertThat(gravado.getValue().getIpSolicitacao(), equalTo("10.0.0.1"));
        assertThat(gravado.getValue().getTokenHash().length(), equalTo(64));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> variaveis = ArgumentCaptor.forClass(Map.class);
        verify(emailTemplateService).renderizarHtml(eq(RecuperacaoSenhaService.TEMPLATE_EMAIL), variaveis.capture());
        String link = (String) variaveis.getValue().get("link");
        assertThat(link, containsString("https://siszoo.itu.sp.gov.br/redefinir-senha?token="));
        String token = link.substring(link.indexOf("token=") + "token=".length());
        assertThat(TokenOpaco.hash(token), equalTo(gravado.getValue().getTokenHash()));
        assertThat(variaveis.getValue().get("validadeMinutos"), equalTo(30L));
        verify(emailService).enviar(EMAIL, RecuperacaoSenhaService.ASSUNTO_EMAIL, "<html>", "texto");
    }

    @Test
    void validarRecusaTokenDesconhecidoVencidoUsadoOuDeUsuarioInativo() {
        when(tokenRepository.buscarPorHash(anyString())).thenReturn(Optional.empty());
        assertThrows(TokenRecuperacaoInvalidoException.class, () -> service.validar("x", "ip"));

        TokenRecuperacaoSenha vencido = token(AGORA.minusMinutes(1));
        when(tokenRepository.buscarPorHash(anyString())).thenReturn(Optional.of(vencido));
        assertThrows(TokenRecuperacaoInvalidoException.class, () -> service.validar("x", "ip"));

        TokenRecuperacaoSenha usado = token(AGORA.plusMinutes(10));
        usado.setUsadoEm(AGORA.minusMinutes(5));
        when(tokenRepository.buscarPorHash(anyString())).thenReturn(Optional.of(usado));
        assertThrows(TokenRecuperacaoInvalidoException.class, () -> service.validar("x", "ip"));

        usuario.setAtivo(false);
        when(tokenRepository.buscarPorHash(anyString())).thenReturn(Optional.of(token(AGORA.plusMinutes(10))));
        assertThrows(TokenRecuperacaoInvalidoException.class, () -> service.validar("x", "ip"));
    }

    @Test
    void validarAceitaTokenPendente() {
        when(tokenRepository.buscarPorHash(TokenOpaco.hash("abc"))).thenReturn(Optional.of(token(AGORA)));

        service.validar("abc", "ip");

        verify(limitador).registrarConsumo("ip");
    }

    @Test
    void redefinirExigeConfirmacaoIgualAntesDeConsultarOToken() {
        assertThrows(SenhasDivergentesException.class,
                () -> service.redefinir(new RedefinirSenhaComTokenRequest("abc", "Senha-Boa-2026", "Outra"), "ip"));

        verifyNoInteractions(tokenRepository);
    }

    @Test
    void redefinirRecusaSenhaForaDaPoliticaSemConsumirOToken() {
        TokenRecuperacaoSenha pendente = token(AGORA.plusMinutes(10));
        when(tokenRepository.buscarPorHashParaAtualizar(TokenOpaco.hash("abc"))).thenReturn(Optional.of(pendente));

        CampoInvalidoException erro = assertThrows(CampoInvalidoException.class,
                () -> service.redefinir(new RedefinirSenhaComTokenRequest("abc", "Maria-2026!", "Maria-2026!"), "ip"));

        assertThat(erro.getCampo(), equalTo("novaSenha"));
        assertThat(pendente.getUsadoEm(), nullValue());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void redefinirConsomeOTokenGravaASenhaEDerrubaTodasAsSessoes() {
        TokenRecuperacaoSenha pendente = token(AGORA.plusMinutes(10));
        pendente.setId(UUID.randomUUID());
        when(tokenRepository.buscarPorHashParaAtualizar(TokenOpaco.hash("abc"))).thenReturn(Optional.of(pendente));
        when(passwordEncoder.matches("Senha-Boa-2026", "hash-atual")).thenReturn(false);
        when(passwordEncoder.encode("Senha-Boa-2026")).thenReturn("hash-novo");

        service.redefinir(new RedefinirSenhaComTokenRequest("abc", "Senha-Boa-2026", "Senha-Boa-2026"), "ip");

        assertThat(usuario.getSenha(), equalTo("hash-novo"));
        assertThat(usuario.getSenhaAlteradaEm(), equalTo(AGORA));
        assertThat(pendente.getUsadoEm(), equalTo(AGORA));
        verify(tokenRepository).invalidarOutrosPendentesDoUsuario(usuario.getId(), pendente.getId(), AGORA);
        verify(sessaoService).encerrarDoUsuario(usuario.getId(), MotivoEncerramentoSessao.SENHA_ALTERADA, null);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> depois = ArgumentCaptor.forClass(Map.class);
        verify(auditoriaEventoService).registrar(eq(usuario), eq(AcaoAuditoria.ATUALIZACAO), eq("usuario"),
                eq(usuario.getId()), any(), depois.capture());
        assertThat(depois.getValue().get("recuperacaoPorEmail"), equalTo(true));
        assertThat(depois.getValue().toString(), not(containsString("Senha-Boa-2026")));
    }

    @Test
    void redefinirRecusaSenhaIgualAAtual() {
        when(tokenRepository.buscarPorHashParaAtualizar(anyString())).thenReturn(Optional.of(token(AGORA.plusMinutes(10))));
        when(passwordEncoder.matches("Senha-Boa-2026", "hash-atual")).thenReturn(true);

        CampoInvalidoException erro = assertThrows(CampoInvalidoException.class,
                () -> service.redefinir(new RedefinirSenhaComTokenRequest("abc", "Senha-Boa-2026", "Senha-Boa-2026"), "ip"));

        assertThat(erro.getMessage(), equalTo("A nova senha precisa ser diferente da senha atual."));
    }

    @Test
    void expurgoApagaSoOsVencidosHaMaisDeSeteDias() {
        when(tokenRepository.apagarExpiradosAntesDe(AGORA.minusDays(7))).thenReturn(2);

        service.expurgarVencidos();

        verify(tokenRepository).apagarExpiradosAntesDe(AGORA.minusDays(7));
    }

    private TokenRecuperacaoSenha token(LocalDateTime expiraEm) {
        TokenRecuperacaoSenha token = new TokenRecuperacaoSenha();
        token.setUsuario(usuario);
        token.setTokenHash("hash");
        token.setCriadoEm(AGORA.minusMinutes(1));
        token.setExpiraEm(expiraEm);
        return token;
    }
}
