package com.siszoo.usuarios.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.siszoo.usuarios.entity.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private static final int TAMANHO_MINIMO_SECRET_BYTES = 32;

    private final SecretKey key;
    private final long expiracaoMinutos;

    public JwtService(
            @Value("${siszoo.jwt.secret:}") String secret,
            @Value("${siszoo.jwt.expiracao-minutos}") long expiracaoMinutos) {
        if (!StringUtils.hasText(secret)
                || secret.getBytes(StandardCharsets.UTF_8).length < TAMANHO_MINIMO_SECRET_BYTES) {
            throw new IllegalStateException(
                    "siszoo.jwt.secret ausente ou curto demais (minimo " + TAMANHO_MINIMO_SECRET_BYTES + " bytes)");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiracaoMinutos = expiracaoMinutos;
    }

    public String gerarToken(Usuario usuario) {
        Instant agora = Instant.now();
        List<String> cargos = usuario.getCargos().stream()
                .map(usuarioCargo -> usuarioCargo.getCargo().getNome())
                .sorted()
                .toList();

        return Jwts.builder()
                .subject(usuario.getId().toString())
                .claim("cargos", cargos)
                .issuedAt(Date.from(agora))
                .expiration(Date.from(agora.plus(expiracaoMinutos, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public Jws<Claims> validarToken(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
    }
}
