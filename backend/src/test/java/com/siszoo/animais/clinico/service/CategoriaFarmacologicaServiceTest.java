package com.siszoo.animais.clinico.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.animais.clinico.dto.CriarCategoriaFarmacologicaRequest;
import com.siszoo.animais.clinico.entity.CategoriaFarmacologica;
import com.siszoo.animais.clinico.exception.CategoriaFarmacologicaJaCadastradaException;
import com.siszoo.animais.clinico.mapper.CategoriaFarmacologicaMapper;
import com.siszoo.animais.clinico.repository.CategoriaFarmacologicaRepository;

@ExtendWith(MockitoExtension.class)
class CategoriaFarmacologicaServiceTest {

    @Mock
    private CategoriaFarmacologicaRepository categoriaFarmacologicaRepository;

    @Mock
    private CategoriaFarmacologicaMapper categoriaFarmacologicaMapper;

    @InjectMocks
    private CategoriaFarmacologicaService categoriaFarmacologicaService;

    @Test
    void deveGravarONomeSemEspacosNasPontas() {
        when(categoriaFarmacologicaRepository.existsByNomeIgnoreCase("Antibiotico")).thenReturn(false);

        categoriaFarmacologicaService.criar(new CriarCategoriaFarmacologicaRequest("  Antibiotico  "));

        ArgumentCaptor<CategoriaFarmacologica> salva = ArgumentCaptor.forClass(CategoriaFarmacologica.class);
        verify(categoriaFarmacologicaRepository).save(salva.capture());
        assertThat(salva.getValue().getNome()).isEqualTo("Antibiotico");
        assertThat(salva.getValue().isAtivo()).isTrue();
    }

    @Test
    void deveRecusarNomeJaCadastradoSemGravar() {
        when(categoriaFarmacologicaRepository.existsByNomeIgnoreCase("Antibiotico")).thenReturn(true);

        assertThatThrownBy(() -> categoriaFarmacologicaService.criar(new CriarCategoriaFarmacologicaRequest("Antibiotico")))
                .isInstanceOf(CategoriaFarmacologicaJaCadastradaException.class);
        verify(categoriaFarmacologicaRepository, never()).save(any());
    }
}
