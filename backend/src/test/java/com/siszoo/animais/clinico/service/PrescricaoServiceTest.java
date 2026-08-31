package com.siszoo.animais.clinico.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.animais.clinico.dto.CriarPrescricaoRequest;
import com.siszoo.animais.clinico.dto.PrescricaoResponse;
import com.siszoo.animais.clinico.entity.Medicamento;
import com.siszoo.animais.clinico.entity.Prescricao;
import com.siszoo.animais.clinico.entity.StatusPrescricao;
import com.siszoo.animais.clinico.entity.UnidadeDose;
import com.siszoo.animais.clinico.entity.UnidadeFrequencia;
import com.siszoo.animais.clinico.entity.ViaAdministracao;
import com.siszoo.animais.clinico.exception.RegistroJaRetificadoException;
import com.siszoo.animais.clinico.exception.RetificacaoAnimalDivergenteException;
import com.siszoo.animais.clinico.mapper.PrescricaoMapper;
import com.siszoo.animais.clinico.repository.MedicamentoRepository;
import com.siszoo.animais.clinico.repository.PrescricaoRepository;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@ExtendWith(MockitoExtension.class)
class PrescricaoServiceTest {

    @Mock
    private PrescricaoRepository prescricaoRepository;

    @Mock
    private MedicamentoRepository medicamentoRepository;

    @Mock
    private AnimalRepository animalRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PrescricaoMapper prescricaoMapper;

    @Mock
    private AuditoriaEventoService auditoriaEventoService;

    @InjectMocks
    private PrescricaoService prescricaoService;

    @Test
    void deveCriarPrescricaoEDispararAuditoriaDeCriacaoQuandoNaoHaRetificacao() {
        UUID animalId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID medicamentoId = UUID.randomUUID();
        Animal animal = animalComId(animalId);
        Usuario usuario = usuarioComId(usuarioId);
        PrescricaoResponse response = respostaQualquer();

        when(animalRepository.findById(animalId)).thenReturn(Optional.of(animal));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
        when(medicamentoRepository.findById(medicamentoId)).thenReturn(Optional.of(new Medicamento()));
        when(prescricaoMapper.toResponse(any(Prescricao.class), isNull())).thenReturn(response);

        PrescricaoResponse resultado = prescricaoService.criar(requestSemRetificacao(animalId, medicamentoId), usuarioId);

        assertThat(resultado).isEqualTo(response);
        verify(prescricaoRepository).save(any(Prescricao.class));
        verify(auditoriaEventoService).registrar(usuario, AcaoAuditoria.CRIACAO, "prescricao", null, response);
    }

    @Test
    void deveLancarExcecaoQuandoRetificaApontaParaRegistroDeOutroAnimal() {
        UUID animalId = UUID.randomUUID();
        UUID outroAnimalId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID medicamentoId = UUID.randomUUID();
        UUID retificaId = UUID.randomUUID();

        Prescricao anterior = new Prescricao();
        anterior.setId(retificaId);
        anterior.setAnimal(animalComId(outroAnimalId));

        when(animalRepository.findById(animalId)).thenReturn(Optional.of(animalComId(animalId)));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuarioComId(usuarioId)));
        when(prescricaoRepository.findById(retificaId)).thenReturn(Optional.of(anterior));

        assertThatThrownBy(() -> prescricaoService.criar(
                requestComRetificacao(animalId, medicamentoId, retificaId), usuarioId))
                .isInstanceOf(RetificacaoAnimalDivergenteException.class);

        verify(prescricaoRepository, never()).save(any());
    }

    @Test
    void deveLancarExcecaoQuandoRegistroJaFoiRetificado() {
        UUID animalId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID medicamentoId = UUID.randomUUID();
        UUID retificaId = UUID.randomUUID();

        Prescricao anterior = new Prescricao();
        anterior.setId(retificaId);
        anterior.setAnimal(animalComId(animalId));

        when(animalRepository.findById(animalId)).thenReturn(Optional.of(animalComId(animalId)));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuarioComId(usuarioId)));
        when(prescricaoRepository.findById(retificaId)).thenReturn(Optional.of(anterior));
        when(prescricaoRepository.existsByRetificaId(retificaId)).thenReturn(true);

        assertThatThrownBy(() -> prescricaoService.criar(
                requestComRetificacao(animalId, medicamentoId, retificaId), usuarioId))
                .isInstanceOf(RegistroJaRetificadoException.class);

        verify(prescricaoRepository, never()).save(any());
    }

    private CriarPrescricaoRequest requestSemRetificacao(UUID animalId, UUID medicamentoId) {
        return new CriarPrescricaoRequest(
                animalId, medicamentoId, LocalDate.now(), null, null, 8, UnidadeFrequencia.HORAS,
                new BigDecimal("10.000"), UnidadeDose.MILIGRAMA, ViaAdministracao.ORAL, StatusPrescricao.ATIVA, null);
    }

    private CriarPrescricaoRequest requestComRetificacao(UUID animalId, UUID medicamentoId, UUID retificaId) {
        return new CriarPrescricaoRequest(
                animalId, medicamentoId, LocalDate.now(), null, null, 8, UnidadeFrequencia.HORAS,
                new BigDecimal("10.000"), UnidadeDose.MILIGRAMA, ViaAdministracao.ORAL, StatusPrescricao.ATIVA, retificaId);
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

    private PrescricaoResponse respostaQualquer() {
        return new PrescricaoResponse(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "Amoxicilina",
                null, null, LocalDate.now(), null, null, 8, UnidadeFrequencia.HORAS,
                new BigDecimal("10.000"), UnidadeDose.MILIGRAMA, ViaAdministracao.ORAL, StatusPrescricao.ATIVA,
                null, null, "ATIVO", null);
    }
}
