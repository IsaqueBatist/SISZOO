package com.siszoo.ocorrencias.service;

import java.time.Clock;
import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.siszoo.ocorrencias.entity.MovimentacaoOcorrencia;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.entity.StatusOcorrencia;
import com.siszoo.ocorrencias.entity.TipoMovimentacaoOcorrencia;
import com.siszoo.ocorrencias.repository.MovimentacaoOcorrenciaRepository;
import com.siszoo.usuarios.entity.Usuario;

@Component
public class RegistroMovimentacaoOcorrencia {

    private final MovimentacaoOcorrenciaRepository movimentacaoRepository;
    private final Clock clock;

    public RegistroMovimentacaoOcorrencia(MovimentacaoOcorrenciaRepository movimentacaoRepository, Clock clock) {
        this.movimentacaoRepository = movimentacaoRepository;
        this.clock = clock;
    }

    public MovimentacaoOcorrencia registrar(Ocorrencia ocorrencia, Usuario autor, TipoMovimentacaoOcorrencia tipo,
            StatusOcorrencia anterior, StatusOcorrencia novo, String descricao) {
        MovimentacaoOcorrencia movimentacao = new MovimentacaoOcorrencia();
        movimentacao.setOcorrencia(ocorrencia);
        movimentacao.setUsuario(autor);
        movimentacao.setTipoMovimentacao(tipo);
        movimentacao.setStatusAnterior(anterior);
        movimentacao.setStatusNovo(novo);
        movimentacao.setData(LocalDateTime.now(clock));
        movimentacao.setDescricao(descricao);
        return movimentacaoRepository.save(movimentacao);
    }
}
