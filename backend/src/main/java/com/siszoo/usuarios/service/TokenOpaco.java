package com.siszoo.usuarios.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

final class TokenOpaco {

    private static final int BYTES_TOKEN = 32;
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private TokenOpaco() {
    }

    static String novo() {
        byte[] bytes = new byte[BYTES_TOKEN];
        ALEATORIO.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponivel na JVM", e);
        }
    }
}
