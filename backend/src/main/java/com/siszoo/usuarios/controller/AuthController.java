package com.siszoo.usuarios.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.comum.security.UsuarioAutenticado;
import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.dto.LoginResponse;
import com.siszoo.usuarios.dto.RedefinirSenhaComTokenRequest;
import com.siszoo.usuarios.dto.RenovarSessaoRequest;
import com.siszoo.usuarios.dto.SolicitarRecuperacaoSenhaRequest;
import com.siszoo.usuarios.dto.TrocarSenhaRequest;
import com.siszoo.usuarios.dto.ValidarTokenRecuperacaoRequest;
import com.siszoo.usuarios.exception.CabecalhoSessaoAusenteException;
import com.siszoo.usuarios.service.AuthService;
import com.siszoo.usuarios.service.RecuperacaoSenhaService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String CABECALHO_SESSAO = "X-SISZOO-Sessao";

    private final AuthService authService;
    private final RecuperacaoSenhaService recuperacaoSenhaService;
    private final CookieSessao cookieSessao;

    public AuthController(AuthService authService, RecuperacaoSenhaService recuperacaoSenhaService,
            CookieSessao cookieSessao) {
        this.authService = authService;
        this.recuperacaoSenhaService = recuperacaoSenhaService;
        this.cookieSessao = cookieSessao;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest requisicao,
            HttpServletResponse resposta) {
        AuthService.SessaoAutenticada sessao = authService.login(
                request, requisicao.getRemoteAddr(), requisicao.getHeader(HttpHeaders.USER_AGENT));
        cookieSessao.gravar(resposta, sessao.tokenRenovacao());
        return sessao.resposta();
    }

    @PostMapping("/renovar")
    public LoginResponse renovar(
            @RequestHeader(value = CABECALHO_SESSAO, required = false) String cabecalhoSessao,
            @CookieValue(value = CookieSessao.NOME, required = false) String tokenRenovacao,
            @RequestBody(required = false) RenovarSessaoRequest request,
            HttpServletResponse resposta) {
        exigirCabecalhoSessao(cabecalhoSessao);
        AuthService.SessaoAutenticada sessao = authService.renovar(
                tokenRenovacao, request != null && Boolean.TRUE.equals(request.houveAtividade()));
        if (sessao.tokenRenovacao() != null) {
            cookieSessao.gravar(resposta, sessao.tokenRenovacao());
        }
        return sessao.resposta();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = CABECALHO_SESSAO, required = false) String cabecalhoSessao,
            @CookieValue(value = CookieSessao.NOME, required = false) String tokenRenovacao,
            HttpServletResponse resposta) {
        exigirCabecalhoSessao(cabecalhoSessao);
        authService.logout(tokenRenovacao);
        cookieSessao.apagar(resposta);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/senha")
    public ResponseEntity<Void> trocarSenha(Authentication authentication, @Valid @RequestBody TrocarSenhaRequest request) {
        authService.trocarSenha(UsuarioAutenticado.id(authentication), UsuarioAutenticado.sessao(authentication), request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/recuperacao")
    public ResponseEntity<Void> solicitarRecuperacaoSenha(@Valid @RequestBody SolicitarRecuperacaoSenhaRequest request,
            HttpServletRequest requisicao) {
        recuperacaoSenhaService.solicitar(request.email(), requisicao.getRemoteAddr());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/recuperacao/validar")
    public ResponseEntity<Void> validarTokenRecuperacao(@Valid @RequestBody ValidarTokenRecuperacaoRequest request,
            HttpServletRequest requisicao) {
        recuperacaoSenhaService.validar(request.token(), requisicao.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/recuperacao/redefinir")
    public ResponseEntity<Void> redefinirSenhaComToken(@Valid @RequestBody RedefinirSenhaComTokenRequest request,
            HttpServletRequest requisicao) {
        recuperacaoSenhaService.redefinir(request, requisicao.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }

    private static void exigirCabecalhoSessao(String cabecalhoSessao) {
        if (cabecalhoSessao == null) {
            throw new CabecalhoSessaoAusenteException();
        }
    }
}
