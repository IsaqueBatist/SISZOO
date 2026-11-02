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

    private static Set<String> nomesDosMetodosPublicosDeclarados(Class<?> tipo, boolean estaticos) {
        return Arrays.stream(tipo.getDeclaredMethods())
                .filter(m -> Modifier.isPublic(m.getModifiers()))
                .filter(m -> Modifier.isStatic(m.getModifiers()) == estaticos)
                .filter(m -> !m.isSynthetic())
                .map(Method::getName)
                .collect(Collectors.toSet());
    }
}
