package com.siszoo.animais.clinico.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.siszoo.animais.clinico.repository.PrescricaoRepository;
import com.siszoo.animais.clinico.repository.ProcedimentoRepository;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;

class RegistrosClinicosSemMutacaoTest {

    @Test
    @DisplayName("[RN-C01] service de Vacinacao so expoe criar, buscarPorId e listar")
    void servicoDeVacinacaoSoExpoeCriarBuscarEListar() {
        assertNomesDosMetodosPublicosDeclarados(VacinacaoService.class, "criar", "buscarPorId", "listar");
    }

    @Test
    @DisplayName("[RN-C01] service de Procedimento so expoe criar, buscarPorId e listar")
    void servicoDeProcedimentoSoExpoeCriarBuscarEListar() {
        assertNomesDosMetodosPublicosDeclarados(ProcedimentoService.class, "criar", "buscarPorId", "listar");
    }

    @Test
    @DisplayName("[RN-C01] service de Prescricao so expoe criar, buscarPorId e listar")
    void servicoDePrescricaoSoExpoeCriarBuscarEListar() {
        assertNomesDosMetodosPublicosDeclarados(PrescricaoService.class, "criar", "buscarPorId", "listar");
    }

    @Test
    @DisplayName("[RN-C01] repository de Vacinacao nao declara metodo de update/delete")
    void repositorioDeVacinacaoSoDeclaraFindersDeRetificacaoEFindAllComEntityGraph() {
        assertNomesDosMetodosPublicosDeclarados(
                VacinacaoRepository.class,
                "existsByRetificaId",
                "findByRetificaId",
                "findByRetificaIdIn",
                "findAll",
                "findVigentesParaAlertaVacinal",
                "existeVigenteDoAnimal",
                "findVigentesSobCustodiaParaKpiVacinacao",
                "countByDataAplicacaoBetween",
                "contarAplicacoesPorVacina",
                "contarAplicacoesPorVeterinario");
    }

    @Test
    @DisplayName("[RN-C01] repository de Procedimento nao declara metodo de update/delete")
    void repositorioDeProcedimentoSoDeclaraFindersDeRetificacaoEFindAllComEntityGraph() {
        assertNomesDosMetodosPublicosDeclarados(
                ProcedimentoRepository.class,
                "existsByRetificaId", "findByRetificaId", "findByRetificaIdIn", "findAll",
                "countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo",
                "contarPorTipo", "contarPorVeterinarioETipo", "listarCirurgias");
    }

    @Test
    @DisplayName("[RN-C01] repository de Prescricao nao declara metodo de update/delete")
    void repositorioDePrescricaoSoDeclaraFindersDeRetificacaoEFindAllComEntityGraph() {
        assertNomesDosMetodosPublicosDeclarados(
                PrescricaoRepository.class,
                "existsByRetificaId",
                "findByRetificaId",
                "findByRetificaIdIn",
                "findAll",
                "countByStatusAndDataFimPrevistaBetweenAndAnimal_Status_CodigoNotIn",
                "countByDataInicioBetween");
    }

    private void assertNomesDosMetodosPublicosDeclarados(Class<?> tipo, String... esperados) {
        Set<String> nomes = Arrays.stream(tipo.getDeclaredMethods())
                .filter(m -> Modifier.isPublic(m.getModifiers()))
                .map(Method::getName)
                .collect(Collectors.toSet());
        assertThat(nomes).containsExactlyInAnyOrder(esperados);
    }
}
