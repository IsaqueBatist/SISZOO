package com.siszoo.usuarios.service;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import com.siszoo.usuarios.entity.CargoPermissao;
import com.siszoo.usuarios.repository.CargoPermissaoRepository;

@Service
public class AutoridadeService {

    private static final String FEATURE_GERAL = "geral";

    private final CargoPermissaoRepository cargoPermissaoRepository;

    public AutoridadeService(CargoPermissaoRepository cargoPermissaoRepository) {
        this.cargoPermissaoRepository = cargoPermissaoRepository;
    }

    public Set<GrantedAuthority> resolverAutoridades(Collection<String> nomesCargos) {
        if (nomesCargos == null || nomesCargos.isEmpty()) {
            return Set.of();
        }

        List<CargoPermissao> permissoes = cargoPermissaoRepository.findByCargoNomeIn(nomesCargos);
        Set<GrantedAuthority> autoridades = new HashSet<>();
        for (CargoPermissao permissao : permissoes) {
            String prefixo = prefixo(permissao);
            if (permissao.isLeitura()) {
                autoridades.add(new SimpleGrantedAuthority(prefixo + ":leitura"));
            }
            if (permissao.isEscrita()) {
                autoridades.add(new SimpleGrantedAuthority(prefixo + ":escrita"));
            }
            if (permissao.isExclusao()) {
                autoridades.add(new SimpleGrantedAuthority(prefixo + ":exclusao"));
            }
        }
        return autoridades;
    }

    // Feature 'geral' e o acesso ao modulo inteiro (MODULO:acao, formato
    // historico das @PreAuthorize). Qualquer outra feature gera uma autoridade
    // propria (MODULO:feature:acao) e nunca concede o modulo inteiro — ex.:
    // OCORRENCIAS_DENUNCIAS:denunciante_sigiloso:leitura (V10).
    private static String prefixo(CargoPermissao permissao) {
        String modulo = permissao.getModulo().name();
        return FEATURE_GERAL.equals(permissao.getFeature()) ? modulo : modulo + ":" + permissao.getFeature();
    }
}
