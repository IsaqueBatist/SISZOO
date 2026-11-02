package com.siszoo.seed;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Profile;

@Configuration(proxyBeanMethods = false)
@Profile("seed")
@ConditionalOnProperty(prefix = "siszoo.seed", name = "habilitado", havingValue = "true")
@Import({
        SeedExecutor.class,
        UsuariosSeed.class,
        CatalogoClinicoSeed.class,
        BaiasSeed.class,
        AnimaisSeed.class,
        OcorrenciasSeed.class,
        ProcessosSeed.class,
        RelatoriosSeed.class,
        SeedDev.class
})
public class SeedDevConfig {
}
