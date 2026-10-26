package com.siszoo.seed;

import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import com.siszoo.ocorrencias.service.PermissoesOcorrencia;

// Usuario em nome de quem o seed chama os services, com as autoridades reais
// do cargo (AutoridadeService, mesma resolucao do JwtAuthenticationFilter).
// Os services nao conferem RBAC (o @PreAuthorize fica nos controllers):
// `executar` repete a checagem do endpoint equivalente antes de cada operacao.
record SeedAtor(UUID id, String cargo, Set<GrantedAuthority> autoridades) {

    // Mesmo principal do JwtAuthenticationFilter (subject = id do usuario).
    Authentication autenticacao() {
        return new UsernamePasswordAuthenticationToken(id.toString(), null, autoridades);
    }

    PermissoesOcorrencia permissoes() {
        return PermissoesOcorrencia.de(autenticacao());
    }

    // O contexto de seguranca fica com o ator so durante a operacao e e limpo
    // no finally: nada vaza para a thread de subida da aplicacao.
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

    void executarSemRetorno(String autoridadeExigida, Runnable operacao) {
        executar(autoridadeExigida, () -> {
            operacao.run();
            return null;
        });
    }
}
