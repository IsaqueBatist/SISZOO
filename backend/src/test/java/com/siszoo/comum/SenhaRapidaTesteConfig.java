package com.siszoo.comum;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

// BCrypt com custo 4 so nos *IT: mesmo algoritmo e mesmo caminho de codigo
// (encode no cadastro, matches no login), com 2^4 rodadas em vez de 2^10. Os
// ~580 logins da suite custavam ~75 ms cada so de hash. O encoder de producao
// (SecurityConfig, custo 10) nao muda e tem o custo fixado em
// SecurityConfigTest. Hashes de custo 10 continuam verificando aqui: o custo
// vem do proprio hash.
@TestConfiguration(proxyBeanMethods = false)
public class SenhaRapidaTesteConfig {

    @Bean
    @Primary
    PasswordEncoder passwordEncoderDeTeste() {
        return new BCryptPasswordEncoder(4);
    }
}
