package com.siszoo.animais.clinico.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.animais.clinico.dto.CriarProcedimentoRequest;
import com.siszoo.animais.clinico.dto.ProcedimentoResponse;
import com.siszoo.animais.clinico.entity.Procedimento;
import com.siszoo.animais.clinico.entity.TipoProcedimento;
import com.siszoo.animais.clinico.exception.RegistroJaRetificadoException;
import com.siszoo.animais.clinico.exception.RetificacaoAnimalDivergenteException;
import com.siszoo.animais.clinico.mapper.ProcedimentoMapper;
import com.siszoo.animais.clinico.repository.ProcedimentoRepository;
import com.siszoo.animais.clinico.repository.TipoProcedimentoRepository;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@ExtendWith(MockitoExtension.class)
class ProcedimentoServiceTest {

    @Mock
    private ProcedimentoRepository procedimentoRepository;

    @Mock
    private TipoProcedimentoRepository tipoProcedimentoRepository;

    @Mock
    private AnimalRepository animalRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ProcedimentoMapper procedimentoMapper;

    @Mock
    private AuditoriaEventoService auditoriaEventoService;

    @InjectMocks
    private ProcedimentoService procedimentoService;

    @Test
    void deveCriarProcedimentoEDispararAuditoriaDeCriacaoQuandoNaoHaRetificacao() {
        UUID animalId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        Animal animal = animalComId(animalId);
        Usuario usuario = usuarioComId(usuarioId);
        ProcedimentoResponse response = respostaQualquer();

        when(animalRepository.findById(animalId)).thenReturn(Optional.of(animal));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
        when(tipoProcedimentoRepository.findByCodigo("castracao")).thenReturn(Optional.of(new TipoProcedimento()));
        when(procedimentoMapper.toResponse(any(Procedimento.class), isNull())).thenReturn(response);

        ProcedimentoResponse resultado = procedimentoService.criar(requestSemRetificacao(animalId), usuarioId);

        assertThat(resultado).isEqualTo(response);
        verify(procedimentoRepository).save(any(Procedimento.class));
        verify(auditoriaEventoService).registrar(usuario, AcaoAuditoria.CRIACAO, "procedimento", null, response);
    }

    @Test
    void deveLancarExcecaoQuandoRetificaApontaParaRegistroDeOutroAnimal() {
        UUID animalId = UUID.randomUUID();
        UUID outroAnimalId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID retificaId = UUID.randomUUID();

        Procedimento anterior = new Procedimento();
        anterior.setId(retificaId);
        anterior.setAnimal(animalComId(outroAnimalId));

        when(animalRepository.findById(animalId)).thenReturn(Optional.of(animalComId(animalId)));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuarioComId(usuarioId)));
        when(procedimentoRepository.findById(retificaId)).thenReturn(Optional.of(anterior));

        assertThatThrownBy(() -> procedimentoService.criar(requestComRetificacao(animalId, retificaId), usuarioId))
                .isInstanceOf(RetificacaoAnimalDivergenteException.class);

        verify(procedimentoRepository, never()).save(any());
    }

    @Test
    void deveLancarExcecaoQuandoRegistroJaFoiRetificado() {
        UUID animalId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID retificaId = UUID.randomUUID();

        Procedimento anterior = new Procedimento();
        anterior.setId(retificaId);
        anterior.setAnimal(animalComId(animalId));

        when(animalRepository.findById(animalId)).thenReturn(Optional.of(animalComId(animalId)));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuarioComId(usuarioId)));
        when(procedimentoRepository.findById(retificaId)).thenReturn(Optional.of(anterior));
        when(procedimentoRepository.existsByRetificaId(retificaId)).thenReturn(true);

        assertThatThrownBy(() -> procedimentoService.criar(requestComRetificacao(animalId, retificaId), usuarioId))
                .isInstanceOf(RegistroJaRetificadoException.class);

        verify(procedimentoRepository, never()).save(any());
    }

    private CriarProcedimentoRequest requestSemRetificacao(UUID animalId) {
        return new CriarProcedimentoRequest(animalId, "castracao", LocalDate.now(), "Descricao", "Resultado", null);
    }

    private CriarProcedimentoRequest requestComRetificacao(UUID animalId, UUID retificaId) {
        return new CriarProcedimentoRequest(animalId, "castracao", LocalDate.now(), "Descricao", "Resultado", retificaId);
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

    private ProcedimentoResponse respostaQualquer() {
        return new ProcedimentoResponse(
                UUID.randomUUID(), UUID.randomUUID(), "castracao", "Castração",
                null, null, LocalDate.now(), "Descricao", "Resultado", null, null, "ATIVO", null);
    }
}
