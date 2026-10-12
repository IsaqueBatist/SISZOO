package com.siszoo.processos.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.siszoo.comum.service.ProtocoloService;
import com.siszoo.ocorrencias.exception.DataAberturaFuturaException;
import com.siszoo.ocorrencias.service.OcorrenciaService;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;
import com.siszoo.processos.dto.AlterarStatusProcessoRequest;
import com.siszoo.processos.dto.CriarProcessoRequest;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.processos.exception.TransicaoStatusProcessoInvalidaException;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@ExtendWith(MockitoExtension.class)
class ProcessoSanitarioServiceTest {

    @Mock
    private ProcessoSanitarioRepository processoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private OcorrenciaService ocorrenciaService;

    @Mock
    private ProtocoloService protocoloService;

    @Mock
    private AuditoriaEventoService auditoriaEventoService;

    private ProcessoSanitarioService processoService;

    private static final LocalDate HOJE = LocalDate.of(2026, 9, 10);

    private final UUID usuarioId = UUID.randomUUID();

    // Construido a mao (nao @InjectMocks): Clock e valor, nao mock.
    @BeforeEach
    void criarService() {
        Clock clock = Clock.fixed(Instant.parse("2026-09-10T15:00:00Z"), ZoneId.of("America/Sao_Paulo"));
        processoService = new ProcessoSanitarioService(processoRepository, usuarioRepository, ocorrenciaService,
                protocoloService, auditoriaEventoService, clock);
        lenient().when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(new Usuario()));
    }

    static Stream<Arguments> transicoes() {
        return Stream.of(
                // atual, pedido, permitido
                Arguments.of(StatusProcesso.ABERTO, StatusProcesso.AGUARDANDO_RESULTADO, true),
                Arguments.of(StatusProcesso.AGUARDANDO_RESULTADO, StatusProcesso.COM_RESULTADO, true),
                Arguments.of(StatusProcesso.COM_RESULTADO, StatusProcesso.CONCLUIDO, true),
                Arguments.of(StatusProcesso.ABERTO, StatusProcesso.COM_RESULTADO, false),
                Arguments.of(StatusProcesso.ABERTO, StatusProcesso.CONCLUIDO, false),
                Arguments.of(StatusProcesso.AGUARDANDO_RESULTADO, StatusProcesso.ABERTO, false),
                Arguments.of(StatusProcesso.ABERTO, StatusProcesso.ABERTO, false),
                Arguments.of(StatusProcesso.CONCLUIDO, StatusProcesso.CONCLUIDO, false));
    }

    @ParameterizedTest(name = "[D18] {0} -> {1}: permitido = {2}")
    @MethodSource("transicoes")
    void statusSoAvancaUmPasso(StatusProcesso atual, StatusProcesso pedido, boolean permitido) {
        UUID id = UUID.randomUUID();
        ProcessoSanitario processo = new ProcessoSanitario();
        processo.setStatusProcesso(atual);
        when(processoRepository.findByIdForUpdate(id)).thenReturn(Optional.of(processo));

        if (permitido) {
            assertThat(processoService.alterarStatus(id, new AlterarStatusProcessoRequest(pedido), usuarioId).statusProcesso())
                    .isEqualTo(pedido);
        } else {
            assertThatThrownBy(() -> processoService.alterarStatus(id, new AlterarStatusProcessoRequest(pedido), usuarioId))
                    .isInstanceOf(TransicaoStatusProcessoInvalidaException.class);
            assertThat(processo.getStatusProcesso()).isEqualTo(atual);
        }
    }

    @Test
    void dataAberturaFuturaNaoCriaProcesso() {
        PermissoesOcorrencia agente = new PermissoesOcorrencia(usuarioId, true, true);

        assertThatThrownBy(() -> processoService.criar(new CriarProcessoRequest(HOJE.plusDays(1), false, null), agente))
                .isInstanceOf(DataAberturaFuturaException.class);
        verify(processoRepository, never()).save(any());
        verify(protocoloService, never()).proximo(any());
    }

    @Test
    void semEscritaEmOcorrenciasNaoCriaProcessoVinculado() {
        UUID ocorrenciaId = UUID.randomUUID();
        PermissoesOcorrencia vet = new PermissoesOcorrencia(usuarioId, false, false);
        doThrow(new AccessDeniedException("sem escrita"))
                .when(ocorrenciaService).exigirEscritaEmOcorrencias(vet);

        assertThatThrownBy(() -> processoService.criar(new CriarProcessoRequest(HOJE, true, ocorrenciaId), vet))
                .isInstanceOf(AccessDeniedException.class);
        verify(processoRepository, never()).save(any());
        verify(protocoloService, never()).proximo(any());
    }
}
