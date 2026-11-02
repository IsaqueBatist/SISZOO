package com.siszoo.seed;

import java.util.Set;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

public final class SeedDevGuarda {

    static final Set<String> PERFIS_PROIBIDOS = Set.of("docker", "prod");
    static final Set<String> PERFIS_PERMITIDOS = Set.of("dev", "test");

    public SeedDevGuarda(Environment environment) {
        verificar(environment);
    }

    public static void verificar(Environment environment) {
        for (String perfil : PERFIS_PROIBIDOS) {
            if (environment.acceptsProfiles(Profiles.of(perfil))) {
                throw new IllegalStateException("Seed de dados ficticios recusado: perfil '" + perfil
                        + "' ativo. O seed so roda com dev ou test + seed + siszoo.seed.habilitado=true.");
            }
        }
        boolean ambientePermitido = PERFIS_PERMITIDOS.stream()
                .anyMatch(perfil -> environment.acceptsProfiles(Profiles.of(perfil)));
        if (!ambientePermitido) {
            throw new IllegalStateException("Seed de dados ficticios recusado: o perfil 'seed' exige 'dev' ou 'test'"
                    + " ativo junto (perfis ativos: " + String.join(",", environment.getActiveProfiles()) + ").");
        }
    }
}
