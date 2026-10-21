package com.siszoo.processos.service;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

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
import org.springframework.mail.MailSendException;

import com.siszoo.comum.service.EmailService;
import com.siszoo.comum.service.EmailTemplateService;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.ResponsavelProcesso;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResponsavelProcessoRepository;

// T37: NotificacaoResultadoService roda fora da transacao de escrita (chamado
// so pelo NotificacaoResultadoListener, AFTER_COMMIT). Aqui, testes diretos
// do servico — sem Spring, sem @Async — so a logica de melhor esforco. Desde
// a T35 o envio passa pelo EmailService (envio real e template:
// EmailServiceIT); aqui ele e um mock.
@ExtendWith(MockitoExtension.class)
class NotificacaoResultadoServiceTest {

    @Mock private ProcessoSanitarioRepository processoRepository;
    @Mock private ResponsavelProcessoRepository responsavelRepository;
    @Mock private EmailService emailService;
    @Mock private EmailTemplateService emailTemplateService;

    private NotificacaoResultadoService service;

    private final UUID processoId = UUID.randomUUID();

    @BeforeEach
    void criarService() {
        service = new NotificacaoResultadoService(processoRepository, responsavelRepository, emailService,
                emailTemplateService);
    }

    @Test
    void enviaEmailQuandoResponsavelTemEndereco() {
        when(processoRepository.findById(processoId)).thenReturn(Optional.of(processo()));
        when(responsavelRepository.findByProcessoId(processoId)).thenReturn(Optional.of(responsavel("maria@exemplo.com")));
        templatesRenderizados();
        when(emailService.enviar(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.completedFuture(null));

        service.notificarResultado(processoId);

        verify(emailService).enviar("maria@exemplo.com", "SISZOO — Resultado do processo sanitario 045/2026",
                "<p>html</p>", "texto");
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> variaveis = ArgumentCaptor.forClass(Map.class);
        verify(emailTemplateService).renderizarHtml(eq(NotificacaoResultadoService.TEMPLATE_EMAIL), variaveis.capture());
        assertThat(variaveis.getValue(), equalTo(Map.of("nome", "Maria Responsavel", "protocolo", "045/2026")));
    }

    @Test
    void naoEnviaQuandoResponsavelNaoTemEndereco() {
        when(processoRepository.findById(processoId)).thenReturn(Optional.of(processo()));
        when(responsavelRepository.findByProcessoId(processoId)).thenReturn(Optional.of(responsavel(null)));

        service.notificarResultado(processoId);

        verifyNoInteractions(emailService, emailTemplateService);
    }

    @Test
    void naoEnviaQuandoNaoHaResponsavel() {
        when(processoRepository.findById(processoId)).thenReturn(Optional.of(processo()));
        when(responsavelRepository.findByProcessoId(processoId)).thenReturn(Optional.empty());

        service.notificarResultado(processoId);

        verifyNoInteractions(emailService, emailTemplateService);
    }

    // O EmailService nao lanca: a falha vem no future (ja logada por ele).
    @Test
    void falhaDeEnvioNaoPropaga() {
        when(processoRepository.findById(processoId)).thenReturn(Optional.of(processo()));
        when(responsavelRepository.findByProcessoId(processoId)).thenReturn(Optional.of(responsavel("maria@exemplo.com")));
        templatesRenderizados();
        when(emailService.enviar(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.failedFuture(new MailSendException("SMTP indisponivel")));

        service.notificarResultado(processoId);

        verify(emailService).enviar(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void processoInexistenteNaoFalha() {
        when(processoRepository.findById(processoId)).thenReturn(Optional.empty());

        service.notificarResultado(processoId);

        verifyNoInteractions(emailService, emailTemplateService);
    }

    private void templatesRenderizados() {
        when(emailTemplateService.renderizarHtml(eq(NotificacaoResultadoService.TEMPLATE_EMAIL), anyMap()))
                .thenReturn("<p>html</p>");
        when(emailTemplateService.renderizarTexto(eq(NotificacaoResultadoService.TEMPLATE_EMAIL), anyMap()))
                .thenReturn("texto");
    }

    private ProcessoSanitario processo() {
        ProcessoSanitario processo = new ProcessoSanitario();
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
