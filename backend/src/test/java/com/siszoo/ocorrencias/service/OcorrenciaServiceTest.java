package com.siszoo.ocorrencias.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.RecordComponent;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.exception.AnimalNaoEncontradoException;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.comum.service.ProtocoloService;
import com.siszoo.ocorrencias.dto.AtualizarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.DenuncianteRequest;
import com.siszoo.ocorrencias.dto.DenuncianteResponse;
import com.siszoo.ocorrencias.dto.OcorrenciaAuditoriaSnapshot;
import com.siszoo.ocorrencias.entity.Denunciante;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.entity.StatusOcorrencia;
import com.siszoo.ocorrencias.entity.TipoOcorrencia;
import com.siszoo.ocorrencias.exception.AnimalDaOcorrenciaEncerradaException;
import com.siszoo.ocorrencias.exception.AnimalJaVinculadoException;
import com.siszoo.ocorrencias.exception.NomeDenuncianteObrigatorioException;
import com.siszoo.ocorrencias.mapper.OcorrenciaMapper;
import com.siszoo.ocorrencias.repository.AnexoOcorrenciaRepository;
import com.siszoo.ocorrencias.repository.DenunciadoRepository;
import com.siszoo.ocorrencias.repository.DenuncianteRepository;
import com.siszoo.ocorrencias.repository.MovimentacaoOcorrenciaRepository;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.ocorrencias.repository.ProvidenciaTomadaRepository;
import com.siszoo.ocorrencias.repository.TipoOcorrenciaRepository;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@ExtendWith(MockitoExtension.class)
class OcorrenciaServiceTest {

    private static final LocalDate HOJE = LocalDate.of(2026, 9, 10);

    @Mock private OcorrenciaRepository ocorrenciaRepository;
    @Mock private TipoOcorrenciaRepository tipoOcorrenciaRepository;
    @Mock private ProvidenciaTomadaRepository providenciaTomadaRepository;
    @Mock private DenuncianteRepository denuncianteRepository;
    @Mock private DenunciadoRepository denunciadoRepository;
    @Mock private MovimentacaoOcorrenciaRepository movimentacaoRepository;
    @Mock private AnexoOcorrenciaRepository anexoRepository;
    @Mock private ProcessoSanitarioRepository processoRepository;
    @Mock private AnimalRepository animalRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private ProtocoloService protocoloService;
    @Mock private AuditoriaEventoService auditoriaEventoService;
    @Mock private ApplicationEventPublisher eventPublisher;

    private final OcorrenciaMapper mapper = Mappers.getMapper(OcorrenciaMapper.class);
    private OcorrenciaService service;

    private final UUID ocorrenciaId = UUID.randomUUID();
    private final UUID usuarioId = UUID.randomUUID();
    private final PermissoesOcorrencia escritaSemSigilo = new PermissoesOcorrencia(usuarioId, false, true);
    private Ocorrencia ocorrencia;

    @BeforeEach
    void criarService() {
        Clock clock = Clock.fixed(Instant.parse("2026-09-10T15:00:00Z"), ZoneId.of("America/Sao_Paulo"));
        MontadorRespostaOcorrencia montador = new MontadorRespostaOcorrencia(mapper, denuncianteRepository,
                denunciadoRepository, processoRepository, movimentacaoRepository, anexoRepository);
        service = new OcorrenciaService(ocorrenciaRepository, tipoOcorrenciaRepository, providenciaTomadaRepository,
                denuncianteRepository, denunciadoRepository, movimentacaoRepository, processoRepository,
                animalRepository,
                usuarioRepository, protocoloService, mapper, montador, auditoriaEventoService, eventPublisher, clock);

        TipoOcorrencia tipo = new TipoOcorrencia();
        tipo.setCodigo("zoonose");
        ocorrencia = new Ocorrencia();
        ocorrencia.setId(ocorrenciaId);
        ocorrencia.setTipoOcorrencia(tipo);
        lenient().when(ocorrenciaRepository.findByIdForUpdate(ocorrenciaId)).thenReturn(Optional.of(ocorrencia));
        lenient().when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(new Usuario()));
    }

    @Test
    @DisplayName("[D10] sem a feature, alterar o sigilo da 403")
    void alterarSigiloExigeFeature() {
        assertThatThrownBy(() -> service.atualizar(ocorrenciaId, put(false, true, false, null), escritaSemSigilo))
                .isInstanceOf(AccessDeniedException.class);
        verify(ocorrenciaRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("[D10] sem a feature, reenviar o denunciante de sigilosa da 403 (a mascara apagaria os dados)")
    void reenviarDenuncianteSigilosoExigeFeature() {
        ocorrencia.setSigilosa(true);

        assertThatThrownBy(() -> service.atualizar(ocorrenciaId,
                put(false, true, false, new DenuncianteRequest("Outro", null, null, null, null, null, null)),
                escritaSemSigilo))
                .isInstanceOf(AccessDeniedException.class);
        verify(denuncianteRepository, never()).save(any());
    }

    @Test
    @DisplayName("[D32] sem a feature, identificar denuncia anonima da 403")
    void identificarAnonimaExigeFeature() {
        ocorrencia.setAnonima(true);

        assertThatThrownBy(() -> service.atualizar(ocorrenciaId,
                put(false, false, false, new DenuncianteRequest("Identificado", null, null, null, null, null, null)),
                escritaSemSigilo))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("[D33] vinculo sem escrita em ocorrencias da 403 antes de travar qualquer registro")
    void vinculoExigeEscritaEmOcorrencias() {
        PermissoesOcorrencia vet = new PermissoesOcorrencia(usuarioId, false, false);

        assertThatThrownBy(() -> service.vincularProcesso(ocorrenciaId, UUID.randomUUID(), vet))
                .isInstanceOf(AccessDeniedException.class);
        verify(ocorrenciaRepository, never()).findByIdForUpdate(any());
    }

    @Test
    @DisplayName("vincular animal existente grava o vinculo e audita antes e depois")
    void vincularAnimalExistenteGravaEAudita() {
        Animal animal = animalComId(UUID.randomUUID());
        ocorrencia.setRegistradoPor(new Usuario());
        when(animalRepository.findById(animal.getId())).thenReturn(Optional.of(animal));

        service.vincularAnimal(ocorrenciaId, animal.getId(), escritaSemSigilo);

        assertThat(ocorrencia.getAnimal()).isEqualTo(animal);
        verify(ocorrenciaRepository).saveAndFlush(ocorrencia);
        verify(auditoriaEventoService).registrar(any(), eq(AcaoAuditoria.ATUALIZACAO), eq("ocorrencia"),
                eq(ocorrenciaId), any(), any());
    }

    @Test
    @DisplayName("vincular animal inexistente da 404 sem gravar")
    void vincularAnimalInexistente() {
        UUID animalId = UUID.randomUUID();
        when(animalRepository.findById(animalId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.vincularAnimal(ocorrenciaId, animalId, escritaSemSigilo))
                .isInstanceOf(AnimalNaoEncontradoException.class);
        verify(ocorrenciaRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("animal ja vinculado a outra ocorrencia da 409")
    void animalJaVinculadoAOutraOcorrencia() {
        Animal animal = animalComId(UUID.randomUUID());
        Ocorrencia outra = new Ocorrencia();
        outra.setId(UUID.randomUUID());
        outra.setProtocolo("010/2026");
        when(animalRepository.findById(animal.getId())).thenReturn(Optional.of(animal));
        when(ocorrenciaRepository.findByAnimal_Id(animal.getId())).thenReturn(Optional.of(outra));

        assertThatThrownBy(() -> service.vincularAnimal(ocorrenciaId, animal.getId(), escritaSemSigilo))
                .isInstanceOf(AnimalJaVinculadoException.class)
                .hasMessageContaining("010/2026");
        assertThat(ocorrencia.getAnimal()).isNull();
    }

    @Test
    @DisplayName("ocorrencia encerrada sem animal aceita o vinculo uma vez")
    void encerradaSemAnimalAceitaVinculo() {
        Animal animal = animalComId(UUID.randomUUID());
        ocorrencia.setRegistradoPor(new Usuario());
        ReflectionTestUtils.setField(ocorrencia, "statusOcorrencia", StatusOcorrencia.ENCERRADA);
        when(animalRepository.findById(animal.getId())).thenReturn(Optional.of(animal));

        service.vincularAnimal(ocorrenciaId, animal.getId(), escritaSemSigilo);

        assertThat(ocorrencia.getAnimal()).isEqualTo(animal);
    }

    @Test
    @DisplayName("ocorrencia encerrada com animal recusa a troca")
    void encerradaComAnimalRecusaTroca() {
        Animal atual = animalComId(UUID.randomUUID());
        Animal novo = animalComId(UUID.randomUUID());
        ocorrencia.vincularAnimal(atual);
        ReflectionTestUtils.setField(ocorrencia, "statusOcorrencia", StatusOcorrencia.ENCERRADA);
        when(animalRepository.findById(novo.getId())).thenReturn(Optional.of(novo));

        assertThatThrownBy(() -> service.vincularAnimal(ocorrenciaId, novo.getId(), escritaSemSigilo))
                .isInstanceOf(AnimalDaOcorrenciaEncerradaException.class);
        assertThat(ocorrencia.getAnimal()).isEqualTo(atual);
        verify(auditoriaEventoService, never()).registrar(any(), any(), any(), any(), any(), any());
    }

    private static Animal animalComId(UUID id) {
        Animal animal = new Animal();
        animal.setId(id);
        animal.setNome("Caramelo");
        return animal;
    }

    @Test
    @DisplayName("[D14] mascara: so em sigilosa e so sem a feature")
    void mascaraDoDenunciante() {
        Denunciante denunciante = new Denunciante();
        denunciante.setNome("Maria");

        Ocorrencia publica = new Ocorrencia();
        Ocorrencia sigilosa = new Ocorrencia();
        sigilosa.setSigilosa(true);

        assertThat(mapper.denuncianteVisivel(publica, denunciante, false).nome()).isEqualTo("Maria");
        assertThat(mapper.denuncianteVisivel(sigilosa, denunciante, true).nome()).isEqualTo("Maria");
        DenuncianteResponse mascarado = mapper.denuncianteVisivel(sigilosa, denunciante, false);
        assertThat(mascarado).isEqualTo(new DenuncianteResponse(null, null, null, null, null, null, null));
        assertThat(mapper.denuncianteVisivel(sigilosa, null, false)).isNull();
    }

    @Test
    @DisplayName("[D23] snapshot de auditoria nao tem campos do denunciante")
    void snapshotSemDenunciante() {
        assertThat(Arrays.stream(OcorrenciaAuditoriaSnapshot.class.getRecordComponents()).map(RecordComponent::getName))
                .doesNotContain("nome", "cpf", "telefone", "email", "cep", "bairroResidencial", "denunciante");
    }

    @Test
    @DisplayName("[D19] PUT que deixa sem nome uma denuncia nao sigilosa nem anonima da 422")
    void putSemNomeDenunciante() {
        when(denuncianteRepository.findByOcorrenciaId(ocorrenciaId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.atualizar(ocorrenciaId, put(false, false, false, null),
                new PermissoesOcorrencia(usuarioId, true, true)))
                .isInstanceOf(NomeDenuncianteObrigatorioException.class);
    }

    private static AtualizarOcorrenciaRequest put(boolean urgente, boolean sigilosa, boolean anonima,
            DenuncianteRequest denunciante) {
        return new AtualizarOcorrenciaRequest("zoonose", HOJE, null, "Rua A, 1", "Centro", null, "Descricao",
                urgente, sigilosa, anonima, null, null, denunciante, null);
    }
}
