package com.siszoo.usuarios;

import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final Pattern EMAIL_INSTITUCIONAL = Pattern.compile("^[a-z.]+@itu\\.sp\\.gov\\.br$");

    private final UsuarioRepository usuarioRepository;
    private final CargoRepository cargoRepository;
    private final UsuarioCargoRepository usuarioCargoRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${siszoo.admin.email:}")
    private String adminEmail;

    @Value("${siszoo.admin.password:}")
    private String adminPassword;

    public DataSeeder(
            UsuarioRepository usuarioRepository,
            CargoRepository cargoRepository,
            UsuarioCargoRepository usuarioCargoRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.cargoRepository = cargoRepository;
        this.usuarioCargoRepository = usuarioCargoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            return;
        }

        if (usuarioRepository.findByEmail(adminEmail).isPresent()) {
            return;
        }

        if (!EMAIL_INSTITUCIONAL.matcher(adminEmail).matches()) {
            throw new IllegalStateException(
                    "E-mail configurado em siszoo.admin.email nao atende ao padrao institucional exigido.");
        }

        Cargo cargoAdministrador = cargoRepository.findById(CARGO_ADMINISTRADOR_ID)
                .orElseThrow(() -> new IllegalStateException(
                        "Cargo Administrador (id " + CARGO_ADMINISTRADOR_ID + ") nao encontrado. "
                                + "Verifique se as migrations Flyway do modulo usuarios foram aplicadas."));

        Usuario admin = new Usuario();
        admin.setEmail(adminEmail);
        admin.setSenha(passwordEncoder.encode(adminPassword));
        admin.setNome("Administrador");
        admin.setSobrenome("SISZOO");
        usuarioRepository.save(admin);

        UsuarioCargo vinculo = new UsuarioCargo();
        vinculo.setUsuario(admin);
        vinculo.setCargo(cargoAdministrador);
        usuarioCargoRepository.save(vinculo);
    }
}
