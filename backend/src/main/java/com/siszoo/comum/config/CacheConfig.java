package com.siszoo.comum.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

// Habilita @Cacheable para as agregacoes do dashboard (com.siszoo.relatorios,
// T38): maquinas com ~2GB RAM nao aguentam recalcular KPIs/graficos a cada
// refresh/polling do front. O CacheManager em si NAO e declarado aqui como
// @Bean: fica por conta da auto-configuracao do Spring Boot (propriedades
// spring.cache.* em application.yml), de proposito — um CacheManager escrito
// a mao aqui ignoraria spring.cache.type=none do perfil de teste (essa
// propriedade so controla a escolha automatica, nunca um bean definido pelo
// usuario), e o banco de teste compartilhado sem rollback
// (AbstractIntegrationTest) exige poder desligar o cache nos testes. TTL e
// tamanho maximo do Caffeine ficam em application.yml
// (spring.cache.caffeine.spec) — sem @CacheEvict: ver docs/contratos/dashboard-kpis.md
// para o atraso que isso pode introduzir.
@Configuration
@EnableCaching
public class CacheConfig {
}
