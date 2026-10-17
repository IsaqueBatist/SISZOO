package com.siszoo.processos.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
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
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;

import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.EspecieRepository;
import com.siszoo.comum.service.ProtocoloService;
import com.siszoo.ocorrencias.exception.DataAberturaFuturaException;
import com.siszoo.ocorrencias.service.OcorrenciaService;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;
import com.siszoo.processos.dto.AlterarStatusProcessoRequest;
import com.siszoo.processos.dto.AmostraAnimalRequest;
import com.siszoo.processos.dto.CriarProcessoRequest;
import com.siszoo.processos.dto.ResponsavelProcessoRequest;
import com.siszoo.processos.entity.Doenca;
import com.siszoo.processos.entity.Laboratorio;
import com.siszoo.processos.entity.MaterialBiologico;
import com.siszoo.processos.entity.NivelContato;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.StatusClinicoAmostra;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.processos.entity.TipoAbrigo;
import com.siszoo.processos.exception.ContatoHumanoInconsistenteException;
import com.siszoo.processos.exception.DataColetaFuturaException;
import com.siszoo.processos.exception.IdentificacaoComAnimalDoCanilException;
import com.siszoo.processos.exception.IdentificacaoObrigatoriaException;
import com.siszoo.processos.exception.SintomaSemStatusSintomaticoException;
import com.siszoo.processos.exception.TransicaoStatusProcessoInvalidaException;
import com.siszoo.processos.repository.AnimalAmostradoRepository;
import com.siszoo.processos.repository.DesfechoAnimalRepository;
import com.siszoo.processos.repository.DoencaRepository;
import com.siszoo.processos.repository.LaboratorioRepository;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResponsavelProcessoRepository;
import com.siszoo.processos.repository.ResultadoLaboratorialRepository;
import com.siszoo.processos.repository.SintomaRepository;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@ExtendWith(MockitoExtension.class)
class ProcessoSanitarioServiceTest {

    @Mock private ProcessoSanitarioRepository processoRepository;
    @Mock private ResponsavelProcessoRepository responsavelRepository;
    @Mock private AnimalAmostradoRepository amostraRepository;
    @Mock private DoencaRepository doencaRepository;
    @Mock private LaboratorioRepository laboratorioRepository;
    @Mock private SintomaRepository sintomaRepository;
    @Mock private ResultadoLaboratorialRepository resultadoRepository;
    @Mock private DesfechoAnimalRepository desfechoRepository;
    @Mock private EspecieRepository especieRepository;
    @Mock private AnimalRepository animalRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private OcorrenciaService ocorrenciaService;
    @Mock private ProtocoloService protocoloService;
    @Mock private AuditoriaEventoService auditoriaEventoService;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private JdbcTemplate jdbcTemplate;

    private ProcessoSanitarioService processoService;

    private static final LocalDate HOJE = LocalDate.of(2026, 9, 10);

    private final UUID usuarioId = UUID.randomUUID();

    // Construido a mao (nao @InjectMocks): Clock e valor, nao mock.
    @BeforeEach
    void criarService() {
        Clock clock = Clock.fixed(Instant.parse("2026-09-10T15:00:00Z"), ZoneId.of("America/Sao_Paulo"));
        processoService = new ProcessoSanitarioService(processoRepository, responsavelRepository, amostraRepository,
                doencaRepository, laboratorioRepository, sintomaRepository, resultadoRepository, desfechoRepository,
                especieRepository, animalRepository, usuarioRepository, ocorrenciaService, protocoloService,
                auditoriaEventoService, eventPublisher, jdbcTemplate, clock);
        lenient().when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(new Usuario()));
    }

    static Stream<Arguments> transicoes() {
        return Stream.of(
                // atual, pedido, permitido
                Arguments.of(StatusProcesso.ABERTO, StatusProcesso.AGUARDANDO_RESULTADO, true),
                Arguments.of(StatusProcesso.COM_RESULTADO, StatusProcesso.CONCLUIDO, true),
                Arguments.of(StatusProcesso.ABERTO, StatusProcesso.COM_RESULTADO, false),
                Arguments.of(StatusProcesso.ABERTO, StatusProcesso.CONCLUIDO, false),
                Arguments.of(StatusProcesso.AGUARDANDO_RESULTADO, StatusProcesso.ABERTO, false),
                Arguments.of(StatusProcesso.ABERTO, StatusProcesso.ABERTO, false),
                Arguments.of(StatusProcesso.CONCLUIDO, StatusProcesso.CONCLUIDO, false),
                // T37: essa transicao so acontece via POST /resultado agora —
                // o PATCH /status provisorio (D18) a recusa, mesmo sendo "um
                // passo", porque pularia o registro do resultado.
                Arguments.of(StatusProcesso.AGUARDANDO_RESULTADO, StatusProcesso.COM_RESULTADO, false));
    }

    @ParameterizedTest(name = "[D18/T37] {0} -> {1}: permitido = {2}")
    @MethodSource("transicoes")
    void statusSoAvancaUmPasso(StatusProcesso atual, StatusProcesso pedido, boolean permitido) {
        UUID id = UUID.randomUUID();
        ProcessoSanitario processo = new ProcessoSanitario();
        processo.setStatusProcesso(atual);
        processo.setDoenca(doenca());
        processo.setLaboratorio(laboratorio());
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
        assertThatThrownBy(() -> processoService.criar(request(HOJE.plusDays(1), null, amostraDeCampo()), agente()))
                .isInstanceOf(DataAberturaFuturaException.class);
        verify(processoRepository, never()).save(any());
        verify(protocoloService, never()).proximo(any());
    }

    @Test
    void semEscritaEmOcorrenciasNaoCriaProcessoVinculado() {
        UUID ocorrenciaId = UUID.randomUUID();
        PermissoesOcorrencia vet = new PermissoesOcorrencia(usuarioId, false, false);
        when(doencaRepository.findByCodigo("raiva")).thenReturn(Optional.of(doenca()));
        when(laboratorioRepository.findByCodigo("pasteur_sp")).thenReturn(Optional.of(laboratorio()));
        doThrow(new AccessDeniedException("sem escrita"))
                .when(ocorrenciaService).exigirEscritaEmOcorrencias(vet);

        assertThatThrownBy(() -> processoService.criar(request(HOJE, ocorrenciaId, amostraDeCampo()), vet))
                .isInstanceOf(AccessDeniedException.class);
        verify(processoRepository, never()).save(any());
        verify(protocoloService, never()).proximo(any());
    }

    // ── Regras da amostra: recusadas antes de qualquer acesso ao banco ──

    static Stream<Arguments> amostrasInvalidas() {
        return Stream.of(
                Arguments.of("canil com identificacao",
                        amostra(UUID.randomUUID(), "canino", null, StatusClinicoAmostra.ASSINTOMATICO, HOJE, false, null, null, List.of()),
                        IdentificacaoComAnimalDoCanilException.class),
                Arguments.of("canil com peso",
                        new AmostraAnimalRequest(UUID.randomUUID(), null, null, null, null, null, null, new BigDecimal("4.50"),
                                StatusClinicoAmostra.ASSINTOMATICO, TipoAbrigo.PERIDOMICILIAR, null, HOJE,
                                MaterialBiologico.SORO, false, null, null, null, List.of()),
                        IdentificacaoComAnimalDoCanilException.class),
                Arguments.of("campo sem especie",
                        amostra(null, null, "macho", StatusClinicoAmostra.ASSINTOMATICO, HOJE, false, null, null, List.of()),
                        IdentificacaoObrigatoriaException.class),
                Arguments.of("campo sem sexo",
                        amostra(null, "canino", null, StatusClinicoAmostra.ASSINTOMATICO, HOJE, false, null, null, List.of()),
                        IdentificacaoObrigatoriaException.class),
                Arguments.of("coleta futura",
                        amostra(null, "canino", "macho", StatusClinicoAmostra.ASSINTOMATICO, HOJE.plusDays(1), false, null, null, List.of()),
                        DataColetaFuturaException.class),
                Arguments.of("contato sem nivel",
                        amostra(null, "canino", "macho", StatusClinicoAmostra.ASSINTOMATICO, HOJE, true, null, false, List.of()),
                        ContatoHumanoInconsistenteException.class),
                Arguments.of("contato sem agressao",
                        amostra(null, "canino", "macho", StatusClinicoAmostra.ASSINTOMATICO, HOJE, true, NivelContato.DIRETA, null, List.of()),
                        ContatoHumanoInconsistenteException.class),
                Arguments.of("nivel sem contato",
                        amostra(null, "canino", "macho", StatusClinicoAmostra.ASSINTOMATICO, HOJE, false, NivelContato.INDIRETA, null, List.of()),
                        ContatoHumanoInconsistenteException.class),
                Arguments.of("sintoma em assintomatico",
                        amostra(null, "canino", "macho", StatusClinicoAmostra.ASSINTOMATICO, HOJE, false, null, null, List.of("apatia")),
                        SintomaSemStatusSintomaticoException.class),
                Arguments.of("sintoma em obito",
                        amostra(null, "canino", "macho", StatusClinicoAmostra.OBITO, HOJE, false, null, null, List.of("apatia")),
                        SintomaSemStatusSintomaticoException.class));
    }

    @ParameterizedTest(name = "[T29] {0}: 422 sem tocar no banco")
    @MethodSource("amostrasInvalidas")
    void amostraInvalidaNaoCriaProcesso(String caso, AmostraAnimalRequest amostra, Class<? extends Throwable> erro) {
        assertThatThrownBy(() -> processoService.criar(request(HOJE, null, amostra), agente()))
                .isInstanceOf(erro);
        verifyNoInteractions(protocoloService, processoRepository, doencaRepository, ocorrenciaService);
    }

    // ── Apoio ────────────────────────────────────────────

    private PermissoesOcorrencia agente() {
        return new PermissoesOcorrencia(usuarioId, true, true);
    }

    private static CriarProcessoRequest request(LocalDate dataAbertura, UUID ocorrenciaId, AmostraAnimalRequest amostra) {
        return new CriarProcessoRequest(dataAbertura, "raiva", "pasteur_sp", ocorrenciaId,
                new ResponsavelProcessoRequest("Responsavel", null, null, null, null, null, null, null),
                List.of(amostra), null);
    }

    private static AmostraAnimalRequest amostraDeCampo() {
        return amostra(null, "canino", "macho", StatusClinicoAmostra.ASSINTOMATICO, HOJE, false, null, null, List.of());
    }

    private static AmostraAnimalRequest amostra(UUID animalId, String especie, String sexo, StatusClinicoAmostra status,
            LocalDate dataColeta, boolean contato, NivelContato nivel, Boolean agrediu, List<String> sintomas) {
        return new AmostraAnimalRequest(animalId, especie, sexo, null, null, null, null, null, status,
                TipoAbrigo.PERIDOMICILIAR, null, dataColeta, MaterialBiologico.SORO, contato, nivel, agrediu, null, sintomas);
    }

    private static Doenca doenca() {
        Doenca doenca = new Doenca();
        doenca.setCodigo("raiva");
        doenca.setNome("Raiva");
        doenca.setCid("A82");
        return doenca;
    }

    private static Laboratorio laboratorio() {
        Laboratorio laboratorio = new Laboratorio();
        laboratorio.setCodigo("pasteur_sp");
        laboratorio.setNome("Pasteur — SP");
        return laboratorio;
    }
}
