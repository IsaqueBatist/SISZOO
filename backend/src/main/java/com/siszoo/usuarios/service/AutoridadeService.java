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
            String modulo = permissao.getModulo().name();
            if (permissao.isLeitura()) {
                autoridades.add(new SimpleGrantedAuthority(modulo + ":leitura"));
            }
            if (permissao.isEscrita()) {
                autoridades.add(new SimpleGrantedAuthority(modulo + ":escrita"));
            }
            if (permissao.isExclusao()) {
                autoridades.add(new SimpleGrantedAuthority(modulo + ":exclusao"));
            }
        }
        return autoridades;
    }
}
