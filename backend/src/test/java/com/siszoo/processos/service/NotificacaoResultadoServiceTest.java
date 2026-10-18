package com.siszoo.processos.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.ResponsavelProcesso;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResponsavelProcessoRepository;

// T37: NotificacaoResultadoService roda fora da transacao de escrita (chamado
// so pelo NotificacaoResultadoListener, AFTER_COMMIT). Aqui, testes diretos
// do servico — sem Spring, sem @Async — so a logica de melhor esforco.
@ExtendWith(MockitoExtension.class)
class NotificacaoResultadoServiceTest {

    @Mock private ProcessoSanitarioRepository processoRepository;
    @Mock private ResponsavelProcessoRepository responsavelRepository;
    @Mock private JavaMailSender mailSender;

    private NotificacaoResultadoService service;

    private final UUID processoId = UUID.randomUUID();

    @BeforeEach
    void criarService() {
        service = new NotificacaoResultadoService(processoRepository, responsavelRepository, mailSender,
                "nao-responda@itu.sp.gov.br");
    }

    @Test
    void enviaEmailQuandoResponsavelTemEndereco() {
        when(processoRepository.findById(processoId)).thenReturn(Optional.of(processo()));
        when(responsavelRepository.findByProcessoId(processoId)).thenReturn(Optional.of(responsavel("maria@exemplo.com")));

        service.notificarResultado(processoId);

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void naoEnviaQuandoResponsavelNaoTemEndereco() {
        when(processoRepository.findById(processoId)).thenReturn(Optional.of(processo()));
        when(responsavelRepository.findByProcessoId(processoId)).thenReturn(Optional.of(responsavel(null)));

        service.notificarResultado(processoId);

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void naoEnviaQuandoNaoHaResponsavel() {
        when(processoRepository.findById(processoId)).thenReturn(Optional.of(processo()));
        when(responsavelRepository.findByProcessoId(processoId)).thenReturn(Optional.empty());

        service.notificarResultado(processoId);

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void falhaDeEnvioNaoPropaga() {
        when(processoRepository.findById(processoId)).thenReturn(Optional.of(processo()));
        when(responsavelRepository.findByProcessoId(processoId)).thenReturn(Optional.of(responsavel("maria@exemplo.com")));
        doThrow(new MailSendException("SMTP indisponivel")).when(mailSender).send(any(SimpleMailMessage.class));

        service.notificarResultado(processoId);

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void processoInexistenteNaoFalha() {
        when(processoRepository.findById(processoId)).thenReturn(Optional.empty());

        service.notificarResultado(processoId);

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
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
