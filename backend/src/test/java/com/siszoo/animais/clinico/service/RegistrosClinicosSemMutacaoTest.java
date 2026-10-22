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

// Prova por reflection que os registros clinicos imutaveis (regra de negocio: "nunca
// UPDATE/DELETE") nao tem caminho de mutacao no codigo: nem os services nem
// os repositorios declaram metodo de atualizacao/exclusao. E um guarda de
// regressao real — falha se alguem adicionar um `atualizar`/`excluir` depois
// — mais honesto que um metodo morto que so lanca UnsupportedOperationException
// sem nunca ser chamado por ninguem.
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

    // "findAll" aparece como declarado porque o repositorio sobrescreve o
    // metodo herdado de JpaSpecificationExecutor so para anotar com
    // @EntityGraph (evitar N+1 na listagem paginada) — nao e um metodo novo
    // nem de mutacao, so uma leitura ja existente no contrato do Spring Data.
    // "findVigentesParaAlertaVacinal" e a query do alerta de reforco vacinal
    // (com.siszoo.alertas) — tambem leitura pura (@Query JPQL de SELECT).
    // "existeVigenteDoAnimal" alimenta ficha_completa (DER §3.2): SELECT.
    // "findVigentesSobCustodiaParaKpiVacinacao" alimenta o KPI "% vacinados"
    // do dashboard (com.siszoo.relatorios, T38): tambem SELECT, deliberadamente
    // separada de findVigentesParaAlertaVacinal (ver comentario no repository).
    // "countByDataAplicacaoBetween", "contarAplicacoesPorVacina" e
    // "contarAplicacoesPorVeterinario" alimentam o relatorio de vacinacao
    // (com.siszoo.relatorios, T41): COUNT/GROUP BY, tambem leitura pura.
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

    // "countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo",
    // "contarPorTipo", "contarPorVeterinarioETipo" e "listarCirurgias"
    // alimentam o relatorio de procedimentos (com.siszoo.relatorios, T41):
    // COUNT/GROUP BY/SELECT, tambem leitura pura.
    @Test
    @DisplayName("[RN-C01] repository de Procedimento nao declara metodo de update/delete")
    void repositorioDeProcedimentoSoDeclaraFindersDeRetificacaoEFindAllComEntityGraph() {
        assertNomesDosMetodosPublicosDeclarados(
                ProcedimentoRepository.class,
                "existsByRetificaId", "findByRetificaId", "findByRetificaIdIn", "findAll",
                "countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo",
                "contarPorTipo", "contarPorVeterinarioETipo", "listarCirurgias");
    }

    // "countByStatusAndDataFimPrevistaBetweenAndAnimal_Status_CodigoNotIn"
    // alimenta o alerta "medicacao_ativa" do dashboard (com.siszoo.relatorios,
    // T38); "countByDataInicioBetween" alimenta "Medicações" no relatorio de
    // procedimentos (T41): ambos COUNT derivado, sem nenhuma mutacao.
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

    // getDeclaredMethods() so retorna metodos declarados diretamente no tipo
    // (nao herdados), entao para os repositorios isso exclui corretamente
    // save/delete/etc herdados de JpaRepository — sem brigar com o contrato
    // do Spring Data, so provando que NADA de mutacao foi adicionado por cima.
    private void assertNomesDosMetodosPublicosDeclarados(Class<?> tipo, String... esperados) {
        Set<String> nomes = Arrays.stream(tipo.getDeclaredMethods())
                .filter(m -> Modifier.isPublic(m.getModifiers()))
                .map(Method::getName)
                .collect(Collectors.toSet());
        assertThat(nomes).containsExactlyInAnyOrder(esperados);
    }
}
