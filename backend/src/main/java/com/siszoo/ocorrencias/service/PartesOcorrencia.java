package com.siszoo.ocorrencias.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.siszoo.ocorrencias.dto.DenunciadoRequest;
import com.siszoo.ocorrencias.dto.DenuncianteRequest;
import com.siszoo.ocorrencias.entity.Denunciado;
import com.siszoo.ocorrencias.entity.Denunciante;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.exception.AnonimaESigilosaException;
import com.siszoo.ocorrencias.exception.DenuncianteEmDenunciaAnonimaException;
import com.siszoo.ocorrencias.exception.NomeDenuncianteObrigatorioException;
import com.siszoo.ocorrencias.repository.DenunciadoRepository;
import com.siszoo.ocorrencias.repository.DenuncianteRepository;

@Component
public class PartesOcorrencia {

    private final DenuncianteRepository denuncianteRepository;
    private final DenunciadoRepository denunciadoRepository;

    public PartesOcorrencia(DenuncianteRepository denuncianteRepository, DenunciadoRepository denunciadoRepository) {
        this.denuncianteRepository = denuncianteRepository;
        this.denunciadoRepository = denunciadoRepository;
    }

    public void validarAnonimato(boolean anonima, boolean sigilosa, DenuncianteRequest denunciante) {
        if (anonima && sigilosa) {
            throw new AnonimaESigilosaException();
        }
        if (anonima && denunciante != null && denunciante.temAlgumDado()) {
            throw new DenuncianteEmDenunciaAnonimaException();
        }
    }

    public void validarNomeDenunciante(boolean anonima, boolean sigilosa, String nome) {
        if (!anonima && !sigilosa && !StringUtils.hasText(nome)) {
            throw new NomeDenuncianteObrigatorioException();
        }
    }

    public Optional<Denunciante> denuncianteDe(UUID ocorrenciaId) {
        return denuncianteRepository.findByOcorrenciaId(ocorrenciaId);
    }

    public void salvarDenunciante(Ocorrencia ocorrencia, Optional<Denunciante> existente, DenuncianteRequest dados) {
        Denunciante denunciante = existente.orElseGet(() -> {
            Denunciante novo = new Denunciante();
            novo.setOcorrencia(ocorrencia);
            return novo;
        });
        denunciante.setNome(dados.nome());
        denunciante.setCpf(dados.cpf());
        denunciante.setTelefone(dados.telefone());
        denunciante.setEmail(dados.email());
        denunciante.setCep(dados.cep());
        denunciante.setEndereco(dados.endereco());
        denunciante.setBairroResidencial(dados.bairroResidencial());
        denuncianteRepository.save(denunciante);
    }

    public void registrarDenunciado(Ocorrencia ocorrencia, DenunciadoRequest dados) {
        if (dados != null && dados.temAlgumDado()) {
            salvarDenunciado(ocorrencia, Optional.empty(), dados);
        }
    }

    public void atualizarDenunciado(Ocorrencia ocorrencia, DenunciadoRequest dados) {
        if (dados == null) {
            return;
        }
        Optional<Denunciado> atual = denunciadoRepository.findByOcorrenciaId(ocorrencia.getId());
        if (atual.isPresent() || dados.temAlgumDado()) {
            salvarDenunciado(ocorrencia, atual, dados);
        }
    }

    private void salvarDenunciado(Ocorrencia ocorrencia, Optional<Denunciado> existente, DenunciadoRequest dados) {
        Denunciado denunciado = existente.orElseGet(() -> {
            Denunciado novo = new Denunciado();
            novo.setOcorrencia(ocorrencia);
            return novo;
        });
        denunciado.setNome(dados.nome());
        denunciado.setCpf(dados.cpf());
        denunciado.setTelefone(dados.telefone());
        denunciado.setEndereco(dados.endereco());
        denunciado.setObservacoes(dados.observacoes());
        denunciadoRepository.save(denunciado);
    }
}
