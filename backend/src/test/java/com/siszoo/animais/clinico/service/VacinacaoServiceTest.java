package com.siszoo.animais.clinico.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.animais.clinico.dto.CriarVacinacaoRequest;
import com.siszoo.animais.clinico.dto.VacinacaoResponse;
import com.siszoo.animais.clinico.entity.UnidadeDose;
import com.siszoo.animais.clinico.entity.Vacina;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.clinico.exception.RegistroJaRetificadoException;
import com.siszoo.animais.clinico.exception.RetificacaoAnimalDivergenteException;
import com.siszoo.animais.clinico.mapper.VacinacaoMapper;
import com.siszoo.animais.clinico.repository.VacinaRepository;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@ExtendWith(MockitoExtension.class)
class VacinacaoServiceTest {

    @Mock
    private VacinacaoRepository vacinacaoRepository;

    @Mock
    private VacinaRepository vacinaRepository;

    @Mock
    private AnimalRepository animalRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private VacinacaoMapper vacinacaoMapper;

    @Mock
    private AuditoriaEventoService auditoriaEventoService;

    private VacinacaoService vacinacaoService;

    private static final LocalDate HOJE = LocalDate.of(2026, 9, 10);

    // Construido a mao (nao @InjectMocks): Clock e valor, nao mock.
    @BeforeEach
    void criarService() {
        Clock clock = Clock.fixed(Instant.parse("2026-09-10T15:00:00Z"), ZoneId.of("America/Sao_Paulo"));
        vacinacaoService = new VacinacaoService(vacinacaoRepository, vacinaRepository, animalRepository,
                usuarioRepository, vacinacaoMapper, auditoriaEventoService, clock);
    }

    @Test
    @DisplayName("[RN-C03] criacao gera auditoria CRIACAO")
    void deveCriarVacinacaoEDispararAuditoriaDeCriacaoQuandoNaoHaRetificacao() {
        UUID animalId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        Animal animal = animalComId(animalId);
        Usuario usuario = usuarioComId(usuarioId);
        Vacina vacina = new Vacina();
        VacinacaoResponse response = respostaQualquer();

        when(animalRepository.findById(animalId)).thenReturn(Optional.of(animal));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
        when(vacinaRepository.findByCodigo("antirrabica")).thenReturn(Optional.of(vacina));
        when(vacinacaoMapper.toResponse(any(Vacinacao.class), isNull())).thenReturn(response);

        VacinacaoResponse resultado = vacinacaoService.criar(requestSemRetificacao(animalId), usuarioId);

        assertThat(resultado).isEqualTo(response);
        verify(vacinacaoRepository).save(any(Vacinacao.class));
        verify(auditoriaEventoService).registrar(usuario, AcaoAuditoria.CRIACAO, "vacinacao", null, response);
    }

    @Test
    @DisplayName("[RN-C02][RN-C03] retificacao gera auditoria ATUALIZACAO com antes/depois")
    void deveRetificarVacinacaoEDispararAuditoriaDeAtualizacaoComEstadoAntesEDepois() {
        UUID animalId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID retificaId = UUID.randomUUID();
        Animal animal = animalComId(animalId);
        Usuario usuario = usuarioComId(usuarioId);
        Vacina vacina = new Vacina();

        Vacinacao anterior = new Vacinacao();
        anterior.setId(retificaId);
        anterior.setAnimal(animal);

        VacinacaoResponse respostaAntes = respostaQualquer();
        VacinacaoResponse respostaDepois = respostaQualquer();

        when(animalRepository.findById(animalId)).thenReturn(Optional.of(animal));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
        when(vacinaRepository.findByCodigo("antirrabica")).thenReturn(Optional.of(vacina));
        when(vacinacaoRepository.findById(retificaId)).thenReturn(Optional.of(anterior));
        when(vacinacaoRepository.existsByRetificaId(retificaId)).thenReturn(false);
        when(vacinacaoMapper.toResponse(any(Vacinacao.class), isNull())).thenAnswer(invocation -> {
            Vacinacao argumento = invocation.getArgument(0);
            return argumento == anterior ? respostaAntes : respostaDepois;
        });

        VacinacaoResponse resultado = vacinacaoService.criar(requestComRetificacao(animalId, retificaId), usuarioId);

        assertThat(resultado).isEqualTo(respostaDepois);
        verify(auditoriaEventoService).registrar(usuario, AcaoAuditoria.ATUALIZACAO, "vacinacao", respostaAntes, respostaDepois);
    }

    @Test
    @DisplayName("[RN-C02] retificacao deve ser do mesmo animal")
    void deveLancarExcecaoQuandoRetificaApontaParaRegistroDeOutroAnimal() {
        UUID animalId = UUID.randomUUID();
        UUID outroAnimalId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID retificaId = UUID.randomUUID();

        Vacinacao anterior = new Vacinacao();
        anterior.setId(retificaId);
        anterior.setAnimal(animalComId(outroAnimalId));

        when(animalRepository.findById(animalId)).thenReturn(Optional.of(animalComId(animalId)));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuarioComId(usuarioId)));
        when(vacinacaoRepository.findById(retificaId)).thenReturn(Optional.of(anterior));

        assertThatThrownBy(() -> vacinacaoService.criar(requestComRetificacao(animalId, retificaId), usuarioId))
                .isInstanceOf(RetificacaoAnimalDivergenteException.class);

        verify(vacinacaoRepository, never()).save(any());
        verify(auditoriaEventoService, never()).registrar(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("[RN-C02] registro so pode ser retificado uma vez")
    void deveLancarExcecaoQuandoRegistroJaFoiRetificado() {
        UUID animalId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID retificaId = UUID.randomUUID();

        Vacinacao anterior = new Vacinacao();
        anterior.setId(retificaId);
        anterior.setAnimal(animalComId(animalId));

        when(animalRepository.findById(animalId)).thenReturn(Optional.of(animalComId(animalId)));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuarioComId(usuarioId)));
        when(vacinacaoRepository.findById(retificaId)).thenReturn(Optional.of(anterior));
        when(vacinacaoRepository.existsByRetificaId(retificaId)).thenReturn(true);

        assertThatThrownBy(() -> vacinacaoService.criar(requestComRetificacao(animalId, retificaId), usuarioId))
                .isInstanceOf(RegistroJaRetificadoException.class);

        verify(vacinacaoRepository, never()).save(any());
    }

    private CriarVacinacaoRequest requestSemRetificacao(UUID animalId) {
        return new CriarVacinacaoRequest(
                animalId, "antirrabica", HOJE, 1, new BigDecimal("1.000"), UnidadeDose.MILILITRO, "LOTE1", null, null);
    }

    private CriarVacinacaoRequest requestComRetificacao(UUID animalId, UUID retificaId) {
        return new CriarVacinacaoRequest(
                animalId, "antirrabica", HOJE, 1, new BigDecimal("1.000"), UnidadeDose.MILILITRO, "LOTE1", null,
                retificaId);
    }

    private Animal animalComId(UUID id) {
        Animal animal = new Animal();
        animal.setId(id);
        return animal;
    }

    private Usuario usuarioComId(UUID id) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        return usuario;
    }

    private VacinacaoResponse respostaQualquer() {
        return new VacinacaoResponse(
                UUID.randomUUID(), UUID.randomUUID(), "antirrabica", "Antirrábica",
                null, null, HOJE, null, 1, new BigDecimal("1.000"), UnidadeDose.MILILITRO,
                "LOTE1", null, null, null, "ATIVO", null);
    }
}
