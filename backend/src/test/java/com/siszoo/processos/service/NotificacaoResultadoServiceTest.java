package com.siszoo.processos.service;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
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

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.mail.MailSendException;

import com.siszoo.comum.service.EmailService;
import com.siszoo.comum.service.EmailTemplateService;
import com.siszoo.comum.service.LogCapturado;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.ResponsavelProcesso;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResponsavelProcessoRepository;

import ch.qos.logback.classic.Level;

// T37: NotificacaoResultadoService roda fora da transacao de escrita (chamado
// so pelo NotificacaoResultadoListener, AFTER_COMMIT). Aqui, testes diretos
// do servico — sem Spring, sem @Async — so a logica de melhor esforco. Desde
// a T35 o envio passa pelo EmailService (envio real e template:
// EmailServiceIT); aqui ele e um mock. Futures ja concluidos: o callback roda
// na hora, na thread do teste.
@ExtendWith(MockitoExtension.class)
class NotificacaoResultadoServiceTest {

    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    private static final Instant AGORA = Instant.parse("2026-10-21T15:30:00Z");

    @Mock private ProcessoSanitarioRepository processoRepository;
    @Mock private ResponsavelProcessoRepository responsavelRepository;
    @Mock private EmailService emailService;
    @Mock private EmailTemplateService emailTemplateService;
    @Mock private ProcessoSanitarioService processoSanitarioService;

    private NotificacaoResultadoService service;
    private LogCapturado log;

    private final UUID processoId = UUID.randomUUID();

    @BeforeEach
    void criarService() {
        service = new NotificacaoResultadoService(processoRepository, responsavelRepository, emailService,
                emailTemplateService, processoSanitarioService, Clock.fixed(AGORA, FUSO));
        log = LogCapturado.de(NotificacaoResultadoService.class);
    }

    @AfterEach
    void soltarLog() {
        log.close();
    }

    @Test
    void enviaEmailQuandoResponsavelTemEndereco() {
        processoComResponsavel("maria@exemplo.com");
        templatesRenderizados();
        envio(CompletableFuture.completedFuture(null));

        service.notificarResultado(processoId);

        verify(emailService).enviar("maria@exemplo.com", "SISZOO — Resultado do processo sanitario 045/2026",
                "<p>html</p>", "texto");
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> variaveis = ArgumentCaptor.forClass(Map.class);
        verify(emailTemplateService).renderizarHtml(eq(NotificacaoResultadoService.TEMPLATE_EMAIL), variaveis.capture());
        assertThat(variaveis.getValue(),
                equalTo(Map.of("nome", "Maria Responsavel", "protocolo", "045/2026", "resultado", "registrado")));
    }

    // T35-16: aceite do SMTP grava a data/hora com o relogio do projeto
    // (America/Sao_Paulo: 15:30Z = 12:30 local).
    @Test
    void envioAceitoRegistraADataComORelogioDoProjeto() {
        processoComResponsavel("maria@exemplo.com");
        templatesRenderizados();
        envio(CompletableFuture.completedFuture(null));

        service.notificarResultado(processoId);

        verify(processoSanitarioService).registrarNotificacaoMunicipe(processoId,
                LocalDateTime.of(2026, 10, 21, 12, 30));
    }

    @Test
    void naoEnviaQuandoResponsavelNaoTemEndereco() {
        processoComResponsavel(null);

        service.notificarResultado(processoId);

        verifyNoInteractions(emailService, emailTemplateService, processoSanitarioService);
    }

    @Test
    void naoEnviaQuandoNaoHaResponsavel() {
        when(processoRepository.findById(processoId)).thenReturn(Optional.of(processo()));
        when(responsavelRepository.findByProcessoId(processoId)).thenReturn(Optional.empty());

        service.notificarResultado(processoId);

        verifyNoInteractions(emailService, emailTemplateService, processoSanitarioService);
    }

    // O EmailService nao lanca: a falha vem no future (ja logada por ele) e a
    // data do envio nao e gravada.
    @Test
    void falhaDeEnvioNaoPropagaNemRegistraEnvio() {
        processoComResponsavel("maria@exemplo.com");
        templatesRenderizados();
        envio(CompletableFuture.failedFuture(new MailSendException("SMTP indisponivel")));

        service.notificarResultado(processoId);

        verify(emailService).enviar(anyString(), anyString(), anyString(), anyString());
        verify(processoSanitarioService, never()).registrarNotificacaoMunicipe(any(), any());
    }

    // T35-17: a recusa do executor sobe na chamada, nao no future.
    @Test
    void recusaDoExecutorNaoPropagaNemRegistraEnvio() {
        processoComResponsavel("maria@exemplo.com");
        templatesRenderizados();
        when(emailService.enviar(anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new TaskRejectedException("executor encerrado"));

        service.notificarResultado(processoId);

        verify(processoSanitarioService, never()).registrarNotificacaoMunicipe(any(), any());
        assertThat(log.textos(Level.WARN), hasSize(1));
        assertThat(log.textos(Level.WARN).get(0), containsString("045/2026"));
    }

    // Excecao dentro do callback sumiria no future: vira WARN so com o
    // protocolo, sem endereco nem nome do municipe.
    @Test
    void falhaAoGravarADataViraWarnSoComOProtocolo() {
        processoComResponsavel("maria@exemplo.com");
        templatesRenderizados();
        envio(CompletableFuture.completedFuture(null));
        doThrow(new CannotAcquireLockException("lock maria@exemplo.com"))
                .when(processoSanitarioService).registrarNotificacaoMunicipe(any(), any());

        service.notificarResultado(processoId);

        assertThat(log.textos(Level.WARN), hasSize(1));
        String aviso = log.textos(Level.WARN).get(0);
        assertThat(aviso, containsString("045/2026"));
        assertThat(aviso, containsString("CannotAcquireLockException"));
        assertThat(log.textos(Level.WARN), everyItem(not(containsString("maria@exemplo.com"))));
        assertThat(log.textos(Level.WARN), everyItem(not(containsString("Maria"))));
        assertThat(log.textos(Level.ERROR), empty());
    }

    @Test
    void processoInexistenteNaoFalha() {
        when(processoRepository.findById(processoId)).thenReturn(Optional.empty());

        service.notificarResultado(processoId);

        verifyNoInteractions(emailService, emailTemplateService, processoSanitarioService);
    }

    private void processoComResponsavel(String email) {
        when(processoRepository.findById(processoId)).thenReturn(Optional.of(processo()));
        when(responsavelRepository.findByProcessoId(processoId)).thenReturn(Optional.of(responsavel(email)));
    }

    private void templatesRenderizados() {
        when(emailTemplateService.renderizarHtml(eq(NotificacaoResultadoService.TEMPLATE_EMAIL), anyMap()))
                .thenReturn("<p>html</p>");
        when(emailTemplateService.renderizarTexto(eq(NotificacaoResultadoService.TEMPLATE_EMAIL), anyMap()))
                .thenReturn("texto");
    }

    private void envio(CompletableFuture<Void> resultado) {
        when(emailService.enviar(anyString(), anyString(), anyString(), anyString())).thenReturn(resultado);
    }

    private ProcessoSanitario processo() {
        ProcessoSanitario processo = new ProcessoSanitario();
        processo.setId(processoId);
        processo.setProtocolo("045/2026");
        return processo;
    }

    private ResponsavelProcesso responsavel(String email) {
        ResponsavelProcesso responsavel = new ResponsavelProcesso();
        responsavel.setNome("Maria Responsavel");
        responsavel.setEmail(email);
        return responsavel;
    }
}
