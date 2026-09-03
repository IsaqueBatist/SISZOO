package com.siszoo.animais.clinico.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

import com.siszoo.animais.clinico.repository.PrescricaoRepository;
import com.siszoo.animais.clinico.repository.ProcedimentoRepository;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;

// Prova por reflection que os registros clinicos imutaveis (CLAUDE.md: "nunca
// UPDATE/DELETE") nao tem caminho de mutacao no codigo: nem os services nem
// os repositorios declaram metodo de atualizacao/exclusao. E um guarda de
// regressao real — falha se alguem adicionar um `atualizar`/`excluir` depois
// — mais honesto que um metodo morto que so lanca UnsupportedOperationException
// sem nunca ser chamado por ninguem.
class RegistrosClinicosSemMutacaoTest {

    @Test
    void servicoDeVacinacaoSoExpoeCriarBuscarEListar() {
        assertNomesDosMetodosPublicosDeclarados(VacinacaoService.class, "criar", "buscarPorId", "listar");
    }

    @Test
    void servicoDeProcedimentoSoExpoeCriarBuscarEListar() {
        assertNomesDosMetodosPublicosDeclarados(ProcedimentoService.class, "criar", "buscarPorId", "listar");
    }

    @Test
    void servicoDePrescricaoSoExpoeCriarBuscarEListar() {
        assertNomesDosMetodosPublicosDeclarados(PrescricaoService.class, "criar", "buscarPorId", "listar");
    }

    // "findAll" aparece como declarado porque o repositorio sobrescreve o
    // metodo herdado de JpaSpecificationExecutor so para anotar com
    // @EntityGraph (evitar N+1 na listagem paginada) — nao e um metodo novo
    // nem de mutacao, so uma leitura ja existente no contrato do Spring Data.
    // "findVigentesParaAlertaVacinal" e a query do alerta de reforco vacinal
    // (com.siszoo.alertas) — tambem leitura pura (@Query JPQL de SELECT).
    @Test
    void repositorioDeVacinacaoSoDeclaraFindersDeRetificacaoEFindAllComEntityGraph() {
        assertNomesDosMetodosPublicosDeclarados(
                VacinacaoRepository.class,
                "existsByRetificaId",
                "findByRetificaId",
                "findByRetificaIdIn",
                "findAll",
                "findVigentesParaAlertaVacinal");
    }

    @Test
    void repositorioDeProcedimentoSoDeclaraFindersDeRetificacaoEFindAllComEntityGraph() {
        assertNomesDosMetodosPublicosDeclarados(
                ProcedimentoRepository.class, "existsByRetificaId", "findByRetificaId", "findByRetificaIdIn", "findAll");
    }

    @Test
    void repositorioDePrescricaoSoDeclaraFindersDeRetificacaoEFindAllComEntityGraph() {
        assertNomesDosMetodosPublicosDeclarados(
                PrescricaoRepository.class, "existsByRetificaId", "findByRetificaId", "findByRetificaIdIn", "findAll");
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
