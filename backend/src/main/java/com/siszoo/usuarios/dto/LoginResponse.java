package com.siszoo.usuarios.dto;

public record LoginResponse(String token, UsuarioResponse usuario) {
}
