package com.siszoo.usuarios.dto;

// houveAtividade: so a interacao real da pessoa desliza a janela de
// inatividade. Sem ela (false ou ausente), a renovacao entrega um token de
// acesso novo e mantem o prazo, entao uma aba esquecida nao prolonga a sessao.
public record RenovarSessaoRequest(Boolean houveAtividade) {
}
