package com.siszoo.processos.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.ResultadoProcesso;
import com.siszoo.processos.repository.ResultadoProcessoRepository;

// Prova por reflection, no modelo de RegistrosClinicosSemMutacaoTest, que o
// resultado do processo (T34, registro critico imutavel) nao tem caminho de
// mutacao no codigo: o repositorio so declara finders, a entidade nao tem
// setter nem metodo de instancia que altere estado, e o unico metodo publico
// do service sobre resultado e o registro (que so insere). A barreira no
// banco e o trigger da V14 (ProcessoSanitarioControllerIT e
// MigracaoV14ResultadoProcessoIT).
class ResultadoProcessoSemMutacaoTest {

    @Test
    @DisplayName("[T34] repository de resultado so declara finders")
    void repositorioDeResultadoSoDeclaraFinders() {
        assertThat(nomesDosMetodosPublicosDeclarados(ResultadoProcessoRepository.class, false))
                .containsExactlyInAnyOrder("findByProcessoId", "existsByRetificaId");
    }

    @Test
    @DisplayName("[T34] entidade de resultado sem setters: so getters e as fabricas registrar/retificar")
    void entidadeDeResultadoSemSetters() {
        Set<String> instancia = nomesDosMetodosPublicosDeclarados(ResultadoProcesso.class, false);
        assertThat(instancia).allMatch(nome -> nome.startsWith("get") || nome.equals("equals")
                || nome.equals("hashCode") || nome.equals("canEqual"));
        assertThat(nomesDosMetodosPublicosDeclarados(ResultadoProcesso.class, true))
                .containsExactlyInAnyOrder("registrar", "retificar");
    }

    @Test
    @DisplayName("[T34] vigente do processo so muda por aplicarResultadoVigente (sem setter de resultado)")
    void vigenteDoProcessoSemSetter() {
        assertThat(nomesDosMetodosPublicosDeclarados(ProcessoSanitario.class, false))
                .contains("aplicarResultadoVigente")
                .doesNotContain("setResultadoLaboratorial", "setDataResultado");
    }

    @Test
    @DisplayName("[T34] service so expoe registrarResultado sobre resultado (sem atualizar/excluir)")
    void servicoSoRegistraResultado() {
        assertThat(nomesDosMetodosPublicosDeclarados(ProcessoSanitarioService.class, false).stream()
                .filter(nome -> nome.toLowerCase().contains("resultado")))
                .containsExactly("registrarResultado");
    }

    // getDeclaredMethods() exclui os herdados (save/delete de JpaRepository):
    // prova so que nada de mutacao foi adicionado por cima.
    private static Set<String> nomesDosMetodosPublicosDeclarados(Class<?> tipo, boolean estaticos) {
        return Arrays.stream(tipo.getDeclaredMethods())
                .filter(m -> Modifier.isPublic(m.getModifiers()))
                .filter(m -> Modifier.isStatic(m.getModifiers()) == estaticos)
                .filter(m -> !m.isSynthetic())
                .map(Method::getName)
                .collect(Collectors.toSet());
    }
}
