package com.siszoo.seed;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mock.env.MockEnvironment;

// Guarda de ambiente do seed (SD-1) e o portao unico de ativacao, sem banco.
class SeedDevGuardaTest {

    private static MockEnvironment comPerfis(String... perfis) {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles(perfis);
        return environment;
    }

    @ParameterizedTest
    @ValueSource(strings = {"dev,seed", "test,seed"})
    void aceitaDevOuTesteComSeed(String perfis) {
        assertThatCode(() -> SeedDevGuarda.verificar(comPerfis(perfis.split(",")))).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(strings = {"dev,seed,docker", "seed,prod", "test,seed,prod"})
    void recusaDockerEProd(String perfis) {
        assertThatThrownBy(() -> SeedDevGuarda.verificar(comPerfis(perfis.split(","))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Seed de dados ficticios recusado")
                .hasMessageMatching(".*perfil '(docker|prod)' ativo.*");
    }

    @Test
    void recusaSeedSemDevNemTest() {
        assertThatThrownBy(() -> SeedDevGuarda.verificar(comPerfis("seed")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("exige 'dev' ou 'test'");
    }

    @Test
    void perfilSeedComDockerDerrubaASubida() {
        new ApplicationContextRunner()
                .withInitializer(contexto -> contexto.getEnvironment().setActiveProfiles("dev", "seed", "docker"))
                .withUserConfiguration(SeedDevGuardaConfig.class)
                .run(contexto -> assertThat(contexto).hasFailed());
    }

    @Test
    void semHabilitadoNaoHaSeedMesmoComOPerfil() {
        new ApplicationContextRunner()
                .withInitializer(contexto -> contexto.getEnvironment().setActiveProfiles("dev", "seed"))
                .withUserConfiguration(SeedDevGuardaConfig.class, SeedDevConfig.class)
                .run(contexto -> {
                    assertThat(contexto).hasNotFailed();
                    assertThat(contexto).hasSingleBean(SeedDevGuarda.class);
                    assertThat(contexto).doesNotHaveBean(SeedDev.class);
                });
    }

    @Test
    void semPerfilSeedNemAGuardaExiste() {
        new ApplicationContextRunner()
                .withPropertyValues("siszoo.seed.habilitado=true")
                .withInitializer(contexto -> contexto.getEnvironment().setActiveProfiles("docker"))
                .withUserConfiguration(SeedDevGuardaConfig.class, SeedDevConfig.class)
                .run(contexto -> {
                    assertThat(contexto).hasNotFailed();
                    assertThat(contexto).doesNotHaveBean(SeedDevGuarda.class);
                    assertThat(contexto).doesNotHaveBean(SeedDev.class);
                });
    }
}
