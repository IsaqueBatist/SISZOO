package com.siszoo.processos.dto;

// Evento da edicao pelo Administrador: o snapshot do processo mais o que ele nao
// leva. Excecao a regra de auditoria sem dado pessoal: corrigir um dado do responsavel
// nao pode apagar o valor anterior, e o evento so e consultado por quem edita
// (GET /api/processos/{id}/alteracoes e tela de Logs). Os demais eventos do
// processo seguem sem dado pessoal. justificativa so existe no estado depois.
public record ProcessoEdicaoAuditoria(
        ProcessoAuditoriaSnapshot processo,
        String galNumero,
        String sinanNumero,
        ResponsavelAuditoria responsavel,
        String justificativa) {

    public record ResponsavelAuditoria(
            String nome,
            String cpf,
            String telefone,
            String email,
            String cep,
            String endereco,
            String bairroResidencial,
            String bairroOcorrencia) {
    }
}
