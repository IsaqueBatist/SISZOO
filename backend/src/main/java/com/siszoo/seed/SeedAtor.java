package com.siszoo.seed;

import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import com.siszoo.ocorrencias.service.PermissoesOcorrencia;

record SeedAtor(UUID id, String cargo, Set<GrantedAuthority> autoridades) {

    Authentication autenticacao() {
        return new UsernamePasswordAuthenticationToken(id.toString(), null, autoridades);
    }

    PermissoesOcorrencia permissoes() {
        return PermissoesOcorrencia.de(autenticacao());
    }

    <T> T executar(String autoridadeExigida, Supplier<T> operacao) {
        boolean autorizado = autoridades.stream()
                .anyMatch(a -> autoridadeExigida.equals(a.getAuthority()));
        if (!autorizado) {
            throw new IllegalStateException("Seed: o cargo '" + cargo + "' nao tem " + autoridadeExigida
                    + " (o endpoint equivalente responderia 403).");
        }
        SecurityContextHolder.getContext().setAuthentication(autenticacao());
        try {
            return operacao.get();
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
