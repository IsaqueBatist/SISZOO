package com.siszoo.animais.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.entity.Especie;
import com.siszoo.animais.entity.MotivoEntrada;
import com.siszoo.animais.entity.StatusAnimal;
import com.siszoo.animais.entity.TipoBaia;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.UsuarioRepository;

// @Transactional mantém a sessão Hibernate aberta durante o teste, necessário
// para acessar os proxies @ManyToOne(LAZY) de Animal (especie/status/etc.)
// depois do save/find, já que cada chamada de repositório do Spring Data
// abre e fecha sua própria transação por padrão.
@Transactional
class AnimalRepositoryIT extends AbstractIntegrationTest {

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private BaiaRepository baiaRepository;

    @Autowired
    private EspecieRepository especieRepository;

    @Autowired
    private StatusAnimalRepository statusAnimalRepository;

    @Autowired
    private MotivoEntradaRepository motivoEntradaRepository;

    @Autowired
    private TipoBaiaRepository tipoBaiaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void deveTerCatalogosSeedados() {
        assertThat(especieRepository.count()).isEqualTo(4);
        assertThat(statusAnimalRepository.count()).isEqualTo(7);
        assertThat(motivoEntradaRepository.count()).isEqualTo(5);
        assertThat(tipoBaiaRepository.count()).isEqualTo(3);

        Optional<Especie> canino = especieRepository.findByCodigo("canino");
        assertThat(canino).isPresent();
        assertThat(canino.get().getNome()).isEqualTo("Canino");
    }

    @Test
    void devePersistirAnimalComTodasAsFks() {
        Usuario usuario = criarUsuario("veterinario.teste1@itu.sp.gov.br");
        Baia baia = criarBaia();
        Especie especie = especieRepository.findByCodigo("canino").orElseThrow();
        StatusAnimal status = statusAnimalRepository.findByCodigo("disponivel_adocao").orElseThrow();
        MotivoEntrada motivoEntrada = motivoEntradaRepository.findByCodigo("resgate").orElseThrow();

        Animal animal = new Animal();
        animal.setNome("Rex");
        animal.setEspecie(especie);
        animal.setSexo("macho");
        animal.setStatus(status);
        animal.setMotivoEntrada(motivoEntrada);
        animal.setDataEntrada(LocalDateTime.now());
        animal.setBaia(baia);
        animal.setCriadoPor(usuario);
        animalRepository.save(animal);

        Animal encontrado = animalRepository.findById(animal.getId()).orElseThrow();

        assertThat(encontrado.getEspecie().getCodigo()).isEqualTo("canino");
        assertThat(encontrado.getStatus().getCodigo()).isEqualTo("disponivel_adocao");
        assertThat(encontrado.getMotivoEntrada().getCodigo()).isEqualTo("resgate");
        assertThat(encontrado.getBaia().getId()).isEqualTo(baia.getId());
        assertThat(encontrado.getCriadoPor().getId()).isEqualTo(usuario.getId());
    }

    @Test
    void devePersistirAnimalSemBaiaPorEstarEmTransito() {
        Usuario usuario = criarUsuario("veterinario.teste2@itu.sp.gov.br");
        Especie especie = especieRepository.findByCodigo("felino").orElseThrow();
        StatusAnimal status = statusAnimalRepository.findByCodigo("em_quarentena").orElseThrow();
        MotivoEntrada motivoEntrada = motivoEntradaRepository.findByCodigo("abandono").orElseThrow();

        Animal animal = new Animal();
        animal.setNome("Mimi");
        animal.setEspecie(especie);
        animal.setSexo("femea");
        animal.setStatus(status);
        animal.setMotivoEntrada(motivoEntrada);
        animal.setDataEntrada(LocalDateTime.now());
        animal.setBaia(null);
        animal.setCriadoPor(usuario);
        animalRepository.save(animal);

        Animal encontrado = animalRepository.findById(animal.getId()).orElseThrow();

        assertThat(encontrado.getBaia()).isNull();
    }

    private Usuario criarUsuario(String email) {
        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setSenha("hash-fake-de-teste");
        usuario.setNome("Veterinario");
        usuario.setSobrenome("Teste");
        return usuarioRepository.save(usuario);
    }

    private Baia criarBaia() {
        TipoBaia tipoBaia = tipoBaiaRepository.findByCodigo("interna").orElseThrow();

        Baia baia = new Baia();
        baia.setNome("Baia 1");
        baia.setTipoBaia(tipoBaia);
        baia.setCapacidade((short) 2);
        return baiaRepository.save(baia);
    }
}
