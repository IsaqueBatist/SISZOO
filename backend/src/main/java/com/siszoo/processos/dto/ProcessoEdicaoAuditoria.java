package com.siszoo.processos.dto;

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
