package com.siszoo.usuarios.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;

import com.siszoo.usuarios.entity.CargoPermissao;
import com.siszoo.usuarios.entity.Modulo;
import com.siszoo.usuarios.repository.CargoPermissaoRepository;

@ExtendWith(MockitoExtension.class)
class AutoridadeServiceTest {

    private static final String SIGILO = "OCORRENCIAS_DENUNCIAS:denunciante_sigiloso:leitura";

    @Mock
    private CargoPermissaoRepository cargoPermissaoRepository;

    @InjectMocks
    private AutoridadeService autoridadeService;

    @Test
    @DisplayName("[D26] feature 'geral' continua gerando MODULO:acao")
    void featureGeralGeraAutoridadeDoModulo() {
        when(cargoPermissaoRepository.findByCargoNomeIn(List.of("Veterinário"))).thenReturn(List.of(
                permissao(Modulo.OCORRENCIAS_DENUNCIAS, "geral", true, false, false)));

        assertThat(autoridades("Veterinário")).containsExactly("OCORRENCIAS_DENUNCIAS:leitura");
    }

    @Test
    @DisplayName("[D6] Administrador recebe a feature de sigilo sem nada alem do que ja tinha no modulo")
    void administradorRecebeFeatureDeSigilo() {
        when(cargoPermissaoRepository.findByCargoNomeIn(List.of("Administrador"))).thenReturn(List.of(
                permissao(Modulo.OCORRENCIAS_DENUNCIAS, "geral", true, true, true),
                permissao(Modulo.OCORRENCIAS_DENUNCIAS, "denunciante_sigiloso", true, false, false)));

        assertThat(autoridades("Administrador")).containsExactlyInAnyOrder(
                "OCORRENCIAS_DENUNCIAS:leitura", "OCORRENCIAS_DENUNCIAS:escrita", "OCORRENCIAS_DENUNCIAS:exclusao", SIGILO);
    }

    @Test
    @DisplayName("[D6] Agente Sanitario recebe a feature de sigilo e nao ganha exclusao no modulo")
    void agenteRecebeFeatureDeSigiloSemExclusao() {
        when(cargoPermissaoRepository.findByCargoNomeIn(List.of("Agente Sanitário"))).thenReturn(List.of(
                permissao(Modulo.OCORRENCIAS_DENUNCIAS, "geral", true, true, false),
                permissao(Modulo.OCORRENCIAS_DENUNCIAS, "denunciante_sigiloso", true, false, false)));

        assertThat(autoridades("Agente Sanitário")).containsExactlyInAnyOrder(
                "OCORRENCIAS_DENUNCIAS:leitura", "OCORRENCIAS_DENUNCIAS:escrita", SIGILO);
    }

    @Test
    @DisplayName("[D26] linha de feature com escrita nao concede escrita no modulo inteiro")
    void featureNaoConcedeModuloInteiro() {
        when(cargoPermissaoRepository.findByCargoNomeIn(List.of("Veterinário"))).thenReturn(List.of(
                permissao(Modulo.OCORRENCIAS_DENUNCIAS, "geral", true, false, false),
                permissao(Modulo.OCORRENCIAS_DENUNCIAS, "denunciante_sigiloso", true, true, true)));

        assertThat(autoridades("Veterinário"))
                .contains("OCORRENCIAS_DENUNCIAS:leitura")
                .doesNotContain("OCORRENCIAS_DENUNCIAS:escrita", "OCORRENCIAS_DENUNCIAS:exclusao");
    }

    private Set<String> autoridades(String cargo) {
        return autoridadeService.resolverAutoridades(List.of(cargo)).stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
    }

    private static CargoPermissao permissao(Modulo modulo, String feature, boolean leitura, boolean escrita, boolean exclusao) {
        CargoPermissao permissao = new CargoPermissao();
        permissao.setModulo(modulo);
        permissao.setFeature(feature);
        permissao.setLeitura(leitura);
        permissao.setEscrita(escrita);
        permissao.setExclusao(exclusao);
        return permissao;
    }
}
