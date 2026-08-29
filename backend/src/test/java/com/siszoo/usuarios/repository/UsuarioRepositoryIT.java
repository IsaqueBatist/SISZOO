package com.siszoo.usuarios.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.usuarios.entity.Usuario;

class UsuarioRepositoryIT extends AbstractIntegrationTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void deveRecuperarUsuarioPorEmail() {
        Usuario usuario = new Usuario();
        usuario.setEmail("agente.teste@itu.sp.gov.br");
        usuario.setSenha("hash-fake-de-teste");
        usuario.setNome("Agente");
        usuario.setSobrenome("Teste");
        usuarioRepository.save(usuario);

        Optional<Usuario> encontrado = usuarioRepository.findByEmail("agente.teste@itu.sp.gov.br");

        assertThat(encontrado).isPresent();
        assertThat(encontrado.get().getNome()).isEqualTo("Agente");
        assertThat(encontrado.get().isAtivo()).isTrue();
    }

    @Test
    void naoDeveEncontrarEmailInexistente() {
        Optional<Usuario> encontrado = usuarioRepository.findByEmail("nao.existe@itu.sp.gov.br");

        assertThat(encontrado).isEmpty();
    }
}
