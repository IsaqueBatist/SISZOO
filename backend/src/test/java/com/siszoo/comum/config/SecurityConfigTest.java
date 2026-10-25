package com.siszoo.comum.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

// Os *IT trocam o encoder por um de custo 4 (SenhaRapidaTesteConfig); este
// teste garante que o de producao continua BCrypt com custo 10.
class SecurityConfigTest {

    @Test
    void encoderDeProducaoEhBcryptComCusto10() {
        PasswordEncoder encoder = new SecurityConfig().passwordEncoder();

        String hash = encoder.encode("SenhaDeTeste123");

        assertThat(hash).startsWith("$2a$10$");
        assertThat(encoder.matches("SenhaDeTeste123", hash)).isTrue();
    }
}
