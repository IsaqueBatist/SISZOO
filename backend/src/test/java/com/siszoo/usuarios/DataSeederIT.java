package com.siszoo.usuarios;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargoId;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

@TestPropertySource(properties = {
        "siszoo.admin.email=admin.seed.teste@itu.sp.gov.br",
        "siszoo.admin.password=SenhaForteDeTeste123!"
})
class DataSeederIT extends AbstractIntegrationTest {

    private static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private UsuarioCargoRepository usuarioCargoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private DataSeeder dataSeeder;

    @Test
    void deveCriarAdminComSenhaHasheadaEVinculadoAoCargoAdministrador() {
        Usuario admin = usuarioRepository.findByEmail("admin.seed.teste@itu.sp.gov.br")
                .orElseThrow();

        assertThat(admin.getSenha()).isNotEqualTo("SenhaForteDeTeste123!");
        assertThat(passwordEncoder.matches("SenhaForteDeTeste123!", admin.getSenha())).isTrue();

        UsuarioCargoId vinculoId = new UsuarioCargoId(admin.getId(), CARGO_ADMINISTRADOR_ID);
        assertThat(usuarioCargoRepository.findById(vinculoId)).isPresent();
    }

    @Test
    void naoDeveDuplicarAdminEmExecucoesRepetidas() {
        long totalAntes = usuarioRepository.count();

        dataSeeder.run();
        dataSeeder.run();

        long totalDepois = usuarioRepository.count();

        assertThat(totalDepois).isEqualTo(totalAntes);
    }
}
