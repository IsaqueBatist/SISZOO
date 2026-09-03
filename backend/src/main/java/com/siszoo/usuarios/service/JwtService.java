package com.siszoo.usuarios.service;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
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
    private final Clock clock;
    // Adaptador para o Clock proprio do jjwt (io.jsonwebtoken.Clock, so tem
    // now(): Date) — sem isto, gerarToken() usaria o Clock injetado mas
    // validarToken() checaria expiracao contra o relogio real da JVM, os
    // dois podendo divergir (ex.: Clock.fixed(...) em teste) e invalidando
    // token na hora por "expirado" mesmo tendo acabado de ser emitido.
    private final io.jsonwebtoken.Clock jjwtClock;

    public JwtService(
            @Value("${siszoo.jwt.secret:}") String secret,
            @Value("${siszoo.jwt.expiracao-minutos}") long expiracaoMinutos,
            Clock clock) {
        if (!StringUtils.hasText(secret)
                || secret.getBytes(StandardCharsets.UTF_8).length < TAMANHO_MINIMO_SECRET_BYTES) {
            throw new IllegalStateException(
                    "siszoo.jwt.secret ausente ou curto demais (minimo " + TAMANHO_MINIMO_SECRET_BYTES + " bytes)");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiracaoMinutos = expiracaoMinutos;
        this.clock = clock;
        this.jjwtClock = () -> Date.from(Instant.now(this.clock));
    }

    public String gerarToken(Usuario usuario) {
        Instant agora = Instant.now(clock);
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
        return Jwts.parser().clock(jjwtClock).verifyWith(key).build().parseSignedClaims(token);
    }
}
