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
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;

import com.siszoo.animais.clinico.exception.RegistroJaRetificadoException;
import com.siszoo.animais.entity.Especie;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.EspecieRepository;
import com.siszoo.comum.service.ProtocoloService;
import com.siszoo.ocorrencias.exception.DataAberturaFuturaException;
import com.siszoo.ocorrencias.service.OcorrenciaService;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;
import com.siszoo.processos.dto.AlterarStatusProcessoRequest;
import com.siszoo.processos.dto.AmostraAnimalRequest;
import com.siszoo.processos.dto.CriarProcessoRequest;
import com.siszoo.processos.dto.RegistrarResultadoRequest;
import com.siszoo.processos.dto.ResponsavelProcessoRequest;
import com.siszoo.processos.entity.Doenca;
import com.siszoo.processos.entity.Laboratorio;
import com.siszoo.processos.entity.MaterialBiologico;
import com.siszoo.processos.entity.NivelContato;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.ResultadoLaboratorial;
import com.siszoo.processos.entity.ResultadoProcesso;
import com.siszoo.processos.entity.StatusClinicoAmostra;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.processos.entity.TipoAbrigo;
import com.siszoo.processos.exception.ConclusaoSemResultadoException;
import com.siszoo.processos.exception.ContatoHumanoInconsistenteException;
import com.siszoo.processos.exception.CorrecaoResultadoNaoPermitidaException;
import com.siszoo.processos.exception.DataColetaFuturaException;
import com.siszoo.processos.exception.DataResultadoFuturaException;
import com.siszoo.processos.exception.IdentificacaoComAnimalDoCanilException;
import com.siszoo.processos.exception.IdentificacaoObrigatoriaException;
import com.siszoo.processos.exception.ResultadoInvalidoException;
import com.siszoo.processos.exception.ResultadoJaRegistradoException;
import com.siszoo.processos.exception.ResultadoObrigatorioException;
import com.siszoo.processos.exception.ResultadoRetificadoInvalidoException;
import com.siszoo.processos.exception.SintomaSemStatusSintomaticoException;
import com.siszoo.processos.exception.TransicaoStatusProcessoInvalidaException;
import com.siszoo.processos.repository.AnimalAmostradoRepository;
import com.siszoo.processos.repository.DesfechoAnimalRepository;
import com.siszoo.processos.repository.DoencaRepository;
import com.siszoo.processos.repository.LaboratorioRepository;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResponsavelProcessoRepository;
import com.siszoo.processos.repository.ResultadoLaboratorialRepository;
import com.siszoo.processos.repository.ResultadoProcessoRepository;
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
    @Mock private ResultadoProcessoRepository resultadoProcessoRepository;
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
    private static final LocalDate ABERTURA = HOJE.minusDays(10);

    private final UUID usuarioId = UUID.randomUUID();

    // Construido a mao (nao @InjectMocks): Clock e valor, nao mock.
    @BeforeEach
    void criarService() {
        Clock clock = Clock.fixed(Instant.parse("2026-09-10T15:00:00Z"), ZoneId.of("America/Sao_Paulo"));
        processoService = new ProcessoSanitarioService(processoRepository, responsavelRepository, amostraRepository,
                doencaRepository, laboratorioRepository, sintomaRepository, resultadoRepository,
                resultadoProcessoRepository, desfechoRepository,
                especieRepository, animalRepository, usuarioRepository, ocorrenciaService, protocoloService,
                auditoriaEventoService, eventPublisher, jdbcTemplate, clock);
        lenient().when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(new Usuario()));
    }

    // T34: AGUARDANDO_RESULTADO -> COM_RESULTADO deixou de ser avanco manual
    // (substitui a D18): so pelo registro do resultado.
    static Stream<Arguments> transicoes() {
        Class<? extends Throwable> invalida = TransicaoStatusProcessoInvalidaException.class;
        return Stream.of(
                // atual, pedido, erro esperado (null = permitido)
                Arguments.of(StatusProcesso.ABERTO, StatusProcesso.AGUARDANDO_RESULTADO, null),
                Arguments.of(StatusProcesso.AGUARDANDO_RESULTADO, StatusProcesso.COM_RESULTADO,
                        ResultadoObrigatorioException.class),
                Arguments.of(StatusProcesso.COM_RESULTADO, StatusProcesso.CONCLUIDO, null),
                Arguments.of(StatusProcesso.ABERTO, StatusProcesso.COM_RESULTADO, invalida),
                Arguments.of(StatusProcesso.ABERTO, StatusProcesso.CONCLUIDO, invalida),
                Arguments.of(StatusProcesso.AGUARDANDO_RESULTADO, StatusProcesso.ABERTO, invalida),
                Arguments.of(StatusProcesso.ABERTO, StatusProcesso.ABERTO, invalida),
                Arguments.of(StatusProcesso.CONCLUIDO, StatusProcesso.CONCLUIDO, invalida),
                Arguments.of(StatusProcesso.CONCLUIDO, StatusProcesso.COM_RESULTADO, invalida));
    }

    @ParameterizedTest(name = "[D18/T34] {0} -> {1}: erro = {2}")
    @MethodSource("transicoes")
    void statusSoAvancaUmPasso(StatusProcesso atual, StatusProcesso pedido, Class<? extends Throwable> erro) {
        UUID id = UUID.randomUUID();
        ProcessoSanitario processo = new ProcessoSanitario();
        processo.setDoenca(doenca());
        processo.setLaboratorio(laboratorio());
        if (atual.ordinal() >= StatusProcesso.COM_RESULTADO.ordinal()) {
            // Depois do resultado ha sempre um vigente (CONCLUIDO o exige).
            processo.aplicarResultadoVigente(ResultadoProcesso.registrar(processo, resultado("negativo", true),
                    HOJE, null, new Usuario()));
        }
        processo.setStatusProcesso(atual);
        when(processoRepository.findByIdForUpdate(id)).thenReturn(Optional.of(processo));

        if (erro == null) {
            assertThat(processoService.alterarStatus(id, new AlterarStatusProcessoRequest(pedido), usuarioId).statusProcesso())
                    .isEqualTo(pedido);
        } else {
            assertThatThrownBy(() -> processoService.alterarStatus(id, new AlterarStatusProcessoRequest(pedido), usuarioId))
                    .isInstanceOf(erro);
            assertThat(processo.getStatusProcesso()).isEqualTo(atual);
            verify(processoRepository, never()).saveAndFlush(any());
        }
    }

    // Processo que chegou a COM_RESULTADO sem resultado (PATCH provisorio da
    // D18, antes da T34): CONCLUIDO exige o vigente.
    @Test
    void concluirSemResultadoVigenteRecusado() {
        ProcessoSanitario processo = processoEm(StatusProcesso.COM_RESULTADO);

        assertThatThrownBy(() -> processoService.alterarStatus(processo.getId(),
                new AlterarStatusProcessoRequest(StatusProcesso.CONCLUIDO), usuarioId))
                .isInstanceOf(ConclusaoSemResultadoException.class);
        assertThat(processo.getStatusProcesso()).isEqualTo(StatusProcesso.COM_RESULTADO);
        verify(processoRepository, never()).saveAndFlush(any());
        verifyNoInteractions(auditoriaEventoService);
    }

    // Matriz completa 4x4 da maquina de estados (T34): so o proximo passo.
    static Stream<Arguments> matrizDeTransicoes() {
        Set<String> validas = Set.of("ABERTO>AGUARDANDO_RESULTADO", "AGUARDANDO_RESULTADO>COM_RESULTADO",
                "COM_RESULTADO>CONCLUIDO");
        return Stream.of(StatusProcesso.values()).flatMap(atual -> Stream.of(StatusProcesso.values())
                .map(destino -> Arguments.of(atual, destino, validas.contains(atual + ">" + destino))));
    }

    @ParameterizedTest(name = "[T34] {0} -> {1}: {2}")
    @MethodSource("matrizDeTransicoes")
    void podeTransicionarSoParaOProximo(StatusProcesso atual, StatusProcesso destino, boolean esperado) {
        assertThat(atual.podeTransicionarPara(destino)).isEqualTo(esperado);
        assertThat(destino.exigeResultado()).isEqualTo(destino == StatusProcesso.COM_RESULTADO);
    }

    // ── Resultado (T34) ──────────────────────────────────

    static Stream<Arguments> registroPorStatus() {
        return Stream.of(
                Arguments.of(StatusProcesso.ABERTO, TransicaoStatusProcessoInvalidaException.class),
                Arguments.of(StatusProcesso.COM_RESULTADO, ResultadoJaRegistradoException.class),
                Arguments.of(StatusProcesso.CONCLUIDO, TransicaoStatusProcessoInvalidaException.class));
    }

    @Test
    void primeiroResultadoEmAguardandoVaiParaComResultado() {
        ProcessoSanitario processo = processoEm(StatusProcesso.AGUARDANDO_RESULTADO);
        ResultadoLaboratorial positivo = resultado("positivo", true);
        when(resultadoRepository.findByCodigo("positivo")).thenReturn(Optional.of(positivo));

        assertThat(processoService.registrarResultado(processo.getId(),
                new RegistrarResultadoRequest("positivo", HOJE, "obs", null, null), usuarioId).statusProcesso())
                .isEqualTo(StatusProcesso.COM_RESULTADO);

        ArgumentCaptor<ResultadoProcesso> gravado = ArgumentCaptor.forClass(ResultadoProcesso.class);
        verify(resultadoProcessoRepository).saveAndFlush(gravado.capture());
        assertThat(gravado.getValue().getRetifica()).isNull();
        assertThat(gravado.getValue().getResultadoLaboratorial()).isSameAs(positivo);
        assertThat(gravado.getValue().getDataResultado()).isEqualTo(HOJE);
        assertThat(processo.getResultadoLaboratorial()).isSameAs(positivo);
        assertThat(processo.getDataResultado()).isEqualTo(HOJE);
        verify(auditoriaEventoService).registrar(any(), any(), any(), any(), any(), any());
    }

    @ParameterizedTest(name = "[T34] primeiro resultado em {0}: {1}")
    @MethodSource("registroPorStatus")
    void primeiroResultadoForaDeAguardandoRecusado(StatusProcesso status, Class<? extends Throwable> erro) {
        ProcessoSanitario processo = processoEm(status);
        when(resultadoRepository.findByCodigo("negativo")).thenReturn(Optional.of(resultado("negativo", true)));

        assertThatThrownBy(() -> processoService.registrarResultado(processo.getId(),
                new RegistrarResultadoRequest("negativo", HOJE, null, null, null), usuarioId)).isInstanceOf(erro);
        assertThat(processo.getStatusProcesso()).isEqualTo(status);
        verify(resultadoProcessoRepository, never()).saveAndFlush(any());
        verify(processoRepository, never()).saveAndFlush(any());
    }

    @ParameterizedTest(name = "[T34] resultado {0} recusado")
    @ValueSource(strings = {"aguardando", "inexistente", "inativo"})
    void resultadoForaDosCincoRecusado(String codigo) {
        ProcessoSanitario processo = processoEm(StatusProcesso.AGUARDANDO_RESULTADO);
        Optional<ResultadoLaboratorial> encontrado = switch (codigo) {
            case "aguardando" -> Optional.of(resultado("aguardando", true));
            case "inativo" -> Optional.of(resultado("inativo", false));
            default -> Optional.empty();
        };
        when(resultadoRepository.findByCodigo(codigo)).thenReturn(encontrado);

        assertThatThrownBy(() -> processoService.registrarResultado(processo.getId(),
                new RegistrarResultadoRequest(codigo, HOJE, null, null, null), usuarioId))
                .isInstanceOf(ResultadoInvalidoException.class);
        assertThat(processo.getStatusProcesso()).isEqualTo(StatusProcesso.AGUARDANDO_RESULTADO);
        verify(resultadoProcessoRepository, never()).saveAndFlush(any());
    }

    // Sem limite inferior (docs/decisoes/T34.md): coleta e laudo podem
    // anteceder a abertura do processo, no registro e na correcao.
    @Test
    void dataResultadoAnteriorAAberturaAceitaNoRegistroENaCorrecao() {
        ProcessoSanitario processo = processoEm(StatusProcesso.AGUARDANDO_RESULTADO);
        when(resultadoRepository.findByCodigo("negativo")).thenReturn(Optional.of(resultado("negativo", true)));
        when(resultadoRepository.findByCodigo("positivo")).thenReturn(Optional.of(resultado("positivo", true)));

        assertThat(processoService.registrarResultado(processo.getId(),
                new RegistrarResultadoRequest("negativo", ABERTURA.minusDays(3), null, null, null), usuarioId)
                .dataResultado()).isEqualTo(ABERTURA.minusDays(3));

        ArgumentCaptor<ResultadoProcesso> original = ArgumentCaptor.forClass(ResultadoProcesso.class);
        verify(resultadoProcessoRepository).saveAndFlush(original.capture());
        UUID originalId = UUID.randomUUID();
        when(resultadoProcessoRepository.findById(originalId)).thenReturn(Optional.of(original.getValue()));

        assertThat(processoService.registrarResultado(processo.getId(),
                new RegistrarResultadoRequest("positivo", ABERTURA.minusDays(1), null, originalId, null), usuarioId)
                .dataResultado()).isEqualTo(ABERTURA.minusDays(1));
        assertThat(processo.getDataResultado()).isEqualTo(ABERTURA.minusDays(1));
        assertThat(processo.getStatusProcesso()).isEqualTo(StatusProcesso.COM_RESULTADO);
    }

    @Test
    void dataResultadoFuturaRecusadaSemTocarNoBanco() {
        assertThatThrownBy(() -> processoService.registrarResultado(UUID.randomUUID(),
                new RegistrarResultadoRequest("positivo", HOJE.plusDays(1), null, null, null), usuarioId))
                .isInstanceOf(DataResultadoFuturaException.class);
        verifyNoInteractions(processoRepository, resultadoProcessoRepository);
    }

    @Test
    void correcaoDoVigenteCriaNovoRegistroEMantemComResultado() {
        ProcessoSanitario processo = processoEm(StatusProcesso.COM_RESULTADO);
        UUID anteriorId = UUID.randomUUID();
        ResultadoProcesso anterior = ResultadoProcesso.registrar(processo, resultado("negativo", true),
                HOJE.minusDays(1), null, new Usuario());
        ResultadoLaboratorial positivo = resultado("positivo", true);
        when(resultadoRepository.findByCodigo("positivo")).thenReturn(Optional.of(positivo));
        when(resultadoProcessoRepository.findById(anteriorId)).thenReturn(Optional.of(anterior));
        when(resultadoProcessoRepository.existsByRetificaId(anteriorId)).thenReturn(false);

        assertThat(processoService.registrarResultado(processo.getId(),
                new RegistrarResultadoRequest("positivo", HOJE, null, anteriorId, null), usuarioId).statusProcesso())
                .isEqualTo(StatusProcesso.COM_RESULTADO);

        ArgumentCaptor<ResultadoProcesso> gravado = ArgumentCaptor.forClass(ResultadoProcesso.class);
        verify(resultadoProcessoRepository).saveAndFlush(gravado.capture());
        assertThat(gravado.getValue()).isNotSameAs(anterior);
        assertThat(gravado.getValue().getRetifica()).isSameAs(anterior);
        assertThat(anterior.getResultadoLaboratorial().getCodigo()).isEqualTo("negativo");
        assertThat(processo.getResultadoLaboratorial()).isSameAs(positivo);
    }

    @Test
    void correcaoDeResultadoDeOutroProcessoOuInexistenteRecusada() {
        ProcessoSanitario processo = processoEm(StatusProcesso.COM_RESULTADO);
        ProcessoSanitario outro = processoEm(StatusProcesso.COM_RESULTADO);
        UUID deOutro = UUID.randomUUID();
        UUID inexistente = UUID.randomUUID();
        when(resultadoRepository.findByCodigo("positivo")).thenReturn(Optional.of(resultado("positivo", true)));
        when(resultadoProcessoRepository.findById(deOutro)).thenReturn(Optional.of(
                ResultadoProcesso.registrar(outro, resultado("negativo", true), HOJE, null, new Usuario())));
        when(resultadoProcessoRepository.findById(inexistente)).thenReturn(Optional.empty());

        for (UUID retificaId : List.of(deOutro, inexistente)) {
            assertThatThrownBy(() -> processoService.registrarResultado(processo.getId(),
                    new RegistrarResultadoRequest("positivo", HOJE, null, retificaId, null), usuarioId))
                    .isInstanceOf(ResultadoRetificadoInvalidoException.class);
        }
        verify(resultadoProcessoRepository, never()).saveAndFlush(any());
    }

    @Test
    void correcaoDeResultadoJaCorrigidoRecusada() {
        ProcessoSanitario processo = processoEm(StatusProcesso.COM_RESULTADO);
        UUID anteriorId = UUID.randomUUID();
        when(resultadoRepository.findByCodigo("positivo")).thenReturn(Optional.of(resultado("positivo", true)));
        when(resultadoProcessoRepository.findById(anteriorId)).thenReturn(Optional.of(
                ResultadoProcesso.registrar(processo, resultado("negativo", true), HOJE, null, new Usuario())));
        when(resultadoProcessoRepository.existsByRetificaId(anteriorId)).thenReturn(true);

        assertThatThrownBy(() -> processoService.registrarResultado(processo.getId(),
                new RegistrarResultadoRequest("positivo", HOJE, null, anteriorId, null), usuarioId))
                .isInstanceOf(RegistroJaRetificadoException.class);
        verify(resultadoProcessoRepository, never()).saveAndFlush(any());
    }

    @ParameterizedTest(name = "[T34] correcao em {0}: 422")
    @EnumSource(value = StatusProcesso.class, names = {"ABERTO", "AGUARDANDO_RESULTADO", "CONCLUIDO"})
    void correcaoForaDeComResultadoRecusada(StatusProcesso status) {
        ProcessoSanitario processo = processoEm(status);
        when(resultadoRepository.findByCodigo("positivo")).thenReturn(Optional.of(resultado("positivo", true)));

        assertThatThrownBy(() -> processoService.registrarResultado(processo.getId(),
                new RegistrarResultadoRequest("positivo", HOJE, null, UUID.randomUUID(), null), usuarioId))
                .isInstanceOf(CorrecaoResultadoNaoPermitidaException.class);
        assertThat(processo.getStatusProcesso()).isEqualTo(status);
        verify(resultadoProcessoRepository, never()).saveAndFlush(any());
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

    // ── Urgencia derivada das amostras (DER regra 18) ────

    static Stream<Arguments> contatosDasAmostras() {
        return Stream.of(
                Arguments.of("nenhuma amostra com contato", List.of(false, false, false), false),
                Arguments.of("so uma amostra com contato", List.of(false, true, false), true),
                Arguments.of("todas as amostras com contato", List.of(true, true, true), true));
    }

    @ParameterizedTest(name = "[DER 18] {0}: urgente = {2}")
    @MethodSource("contatosDasAmostras")
    void urgenciaAtribuidaAntesDoSave(String caso, List<Boolean> contatos, boolean esperado) {
        when(doencaRepository.findByCodigo("raiva")).thenReturn(Optional.of(doenca()));
        when(laboratorioRepository.findByCodigo("pasteur_sp")).thenReturn(Optional.of(laboratorio()));
        when(especieRepository.findByCodigo("canino")).thenReturn(Optional.of(especie()));
        // O valor no momento do save, nao o do objeto depois de criar().
        AtomicReference<Boolean> urgenteNoSave = new AtomicReference<>();
        when(processoRepository.save(any())).thenAnswer(invocacao -> {
            ProcessoSanitario processo = invocacao.getArgument(0);
            urgenteNoSave.set(processo.isUrgente());
            return processo;
        });
        List<AmostraAnimalRequest> amostras = contatos.stream()
                .map(contato -> contato ? amostraComContato() : amostraDeCampo())
                .toList();

        processoService.criar(request(HOJE, null, amostras), agente());

        assertThat(urgenteNoSave.get()).isEqualTo(esperado);
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

    private static CriarProcessoRequest request(LocalDate dataAbertura, UUID ocorrenciaId,
            List<AmostraAnimalRequest> amostras) {
        return new CriarProcessoRequest(dataAbertura, "raiva", "pasteur_sp", ocorrenciaId,
                new ResponsavelProcessoRequest("Responsavel", null, null, null, null, null, null, null),
                amostras, null);
    }

    private static AmostraAnimalRequest amostraDeCampo() {
        return amostra(null, "canino", "macho", StatusClinicoAmostra.ASSINTOMATICO, HOJE, false, null, null, List.of());
    }

    private static AmostraAnimalRequest amostraComContato() {
        return amostra(null, "canino", "macho", StatusClinicoAmostra.ASSINTOMATICO, HOJE, true, NivelContato.DIRETA,
                false, List.of());
    }

    private static Especie especie() {
        Especie especie = new Especie();
        especie.setCodigo("canino");
        especie.setNome("Canino");
        return especie;
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

    private ProcessoSanitario processoEm(StatusProcesso status) {
        ProcessoSanitario processo = new ProcessoSanitario();
        processo.setId(UUID.randomUUID());
        processo.setDataAbertura(ABERTURA);
        processo.setStatusProcesso(status);
        processo.setDoenca(doenca());
        processo.setLaboratorio(laboratorio());
        lenient().when(processoRepository.findByIdForUpdate(processo.getId())).thenReturn(Optional.of(processo));
        return processo;
    }

    private static ResultadoLaboratorial resultado(String codigo, boolean ativo) {
        ResultadoLaboratorial resultado = new ResultadoLaboratorial();
        resultado.setCodigo(codigo);
        resultado.setNome(codigo);
        resultado.setAtivo(ativo);
        return resultado;
    }

    private static Laboratorio laboratorio() {
        Laboratorio laboratorio = new Laboratorio();
        laboratorio.setCodigo("pasteur_sp");
        laboratorio.setNome("Pasteur — SP");
        return laboratorio;
    }
}
