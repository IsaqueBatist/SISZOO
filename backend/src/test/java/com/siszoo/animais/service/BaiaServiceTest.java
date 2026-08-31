package com.siszoo.animais.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.animais.dto.AtualizarBaiaRequest;
import com.siszoo.animais.dto.BaiaResponse;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.entity.TipoBaia;
import com.siszoo.animais.mapper.BaiaMapper;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.TipoBaiaRepository;

@ExtendWith(MockitoExtension.class)
class BaiaServiceTest {

    @Mock
    private BaiaRepository baiaRepository;

    @Mock
    private TipoBaiaRepository tipoBaiaRepository;

    @Mock
    private AnimalRepository animalRepository;

    @Mock
    private BaiaMapper baiaMapper;

    @InjectMocks
    private BaiaService baiaService;

    @Test
    void deveMarcarComoNaoSuperlotadaQuandoOcupacaoAbaixoDaCapacidade() {
        UUID id = UUID.randomUUID();
        Baia baia = baiaExistente(id, (short) 5);

        when(baiaRepository.findById(id)).thenReturn(Optional.of(baia));
        when(tipoBaiaRepository.findByCodigo("interna")).thenReturn(Optional.of(new TipoBaia()));
        when(animalRepository.countByBaia_IdAndStatus_CodigoNotIn(eq(id), anyCollection())).thenReturn(3L);
        when(baiaMapper.toResponse(any(), eq(3L), eq(false)))
                .thenReturn(new BaiaResponse(id, "Baia", "interna", "Interna", (short) 5, null, true, null, 3L, false));

        BaiaResponse response = baiaService.atualizar(id, atualizacao("interna", (short) 5));

        assertThat(response.ocupacaoAtual()).isEqualTo(3L);
        assertThat(response.superlotada()).isFalse();
    }

    @Test
    void deveMarcarComoSuperlotadaQuandoOcupacaoIgualACapacidade() {
        UUID id = UUID.randomUUID();
        Baia baia = baiaExistente(id, (short) 2);

        when(baiaRepository.findById(id)).thenReturn(Optional.of(baia));
        when(tipoBaiaRepository.findByCodigo("interna")).thenReturn(Optional.of(new TipoBaia()));
        when(animalRepository.countByBaia_IdAndStatus_CodigoNotIn(eq(id), anyCollection())).thenReturn(2L);
        when(baiaMapper.toResponse(any(), eq(2L), eq(true)))
                .thenReturn(new BaiaResponse(id, "Baia", "interna", "Interna", (short) 2, null, true, null, 2L, true));

        BaiaResponse response = baiaService.atualizar(id, atualizacao("interna", (short) 2));

        assertThat(response.superlotada()).isTrue();
    }

    @Test
    void deveMarcarComoSuperlotadaEPersistirSemLancarExcecaoQuandoOcupacaoAcimaDaCapacidade() {
        UUID id = UUID.randomUUID();
        Baia baia = baiaExistente(id, (short) 2);

        when(baiaRepository.findById(id)).thenReturn(Optional.of(baia));
        when(tipoBaiaRepository.findByCodigo("interna")).thenReturn(Optional.of(new TipoBaia()));
        when(animalRepository.countByBaia_IdAndStatus_CodigoNotIn(eq(id), anyCollection())).thenReturn(3L);
        when(baiaMapper.toResponse(any(), eq(3L), eq(true)))
                .thenReturn(new BaiaResponse(id, "Baia", "interna", "Interna", (short) 2, null, true, null, 3L, true));

        BaiaResponse response = assertDoesNotThrow(() -> baiaService.atualizar(id, atualizacao("interna", (short) 2)));

        assertThat(response.superlotada()).isTrue();
        verify(baiaRepository).save(baia);
    }

    private Baia baiaExistente(UUID id, short capacidade) {
        Baia baia = new Baia();
        baia.setId(id);
        baia.setNome("Baia");
        baia.setCapacidade(capacidade);
        return baia;
    }

    private AtualizarBaiaRequest atualizacao(String tipoBaia, short capacidade) {
        return new AtualizarBaiaRequest("Baia Atualizada", tipoBaia, capacidade, null, null);
    }
}
