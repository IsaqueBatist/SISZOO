package com.siszoo.processos.service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.exception.AnimalNaoEncontradoException;
import com.siszoo.animais.exception.EspecieInvalidaException;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.EspecieRepository;
import com.siszoo.processos.dto.AmostraAnimalRequest;
import com.siszoo.processos.entity.AnimalAmostrado;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.Sintoma;
import com.siszoo.processos.entity.StatusClinicoAmostra;
import com.siszoo.processos.exception.ContatoHumanoInconsistenteException;
import com.siszoo.processos.exception.DataColetaFuturaException;
import com.siszoo.processos.exception.IdentificacaoComAnimalDoCanilException;
import com.siszoo.processos.exception.IdentificacaoObrigatoriaException;
import com.siszoo.processos.exception.SintomaInvalidoException;
import com.siszoo.processos.exception.SintomaSemStatusSintomaticoException;
import com.siszoo.processos.repository.SintomaRepository;

@Component
public class AmostraProcessoFactory {

    private final AnimalRepository animalRepository;
    private final EspecieRepository especieRepository;
    private final SintomaRepository sintomaRepository;

    public AmostraProcessoFactory(AnimalRepository animalRepository, EspecieRepository especieRepository,
            SintomaRepository sintomaRepository) {
        this.animalRepository = animalRepository;
        this.especieRepository = especieRepository;
        this.sintomaRepository = sintomaRepository;
    }

    public void validar(AmostraAnimalRequest amostra, LocalDate hoje) {
        if (amostra.animalId() != null) {
            if (amostra.temIdentificacao()) {
                throw new IdentificacaoComAnimalDoCanilException();
            }
        } else if (amostra.especie() == null || amostra.especie().isBlank() || amostra.sexo() == null) {
            throw new IdentificacaoObrigatoriaException();
        }
        if (amostra.dataColeta().isAfter(hoje)) {
            throw new DataColetaFuturaException();
        }
        boolean comDadosDeContato = amostra.nivelContato() != null || amostra.agrediuHumano() != null;
        boolean contatoCompleto = amostra.nivelContato() != null && amostra.agrediuHumano() != null;
        if (Boolean.TRUE.equals(amostra.contatoHumano()) ? !contatoCompleto : comDadosDeContato) {
            throw new ContatoHumanoInconsistenteException();
        }
        if (!amostra.sintomasOuVazio().isEmpty() && amostra.statusClinico() != StatusClinicoAmostra.SINTOMATICO) {
            throw new SintomaSemStatusSintomaticoException();
        }
    }

    public Map<String, Sintoma> resolverSintomas(List<AmostraAnimalRequest> amostras) {
        Set<String> codigos = amostras.stream()
                .flatMap(amostra -> amostra.sintomasOuVazio().stream())
                .collect(Collectors.toSet());
        if (codigos.isEmpty()) {
            return Map.of();
        }
        Map<String, Sintoma> encontrados = sintomaRepository.findByCodigoIn(codigos).stream()
                .filter(Sintoma::isAtivo)
                .collect(Collectors.toMap(Sintoma::getCodigo, Function.identity()));
        if (!encontrados.keySet().containsAll(codigos)) {
            throw new SintomaInvalidoException();
        }
        return encontrados;
    }

    public AnimalAmostrado nova(ProcessoSanitario processo, AmostraAnimalRequest request, Map<String, Sintoma> sintomas) {
        AnimalAmostrado amostra = new AnimalAmostrado();
        amostra.setProcesso(processo);
        if (request.animalId() != null) {
            Animal animal = animalRepository.findById(request.animalId())
                    .orElseThrow(AnimalNaoEncontradoException::new);
            amostra.setAnimal(animal);
            copiarIdentificacaoDaFicha(amostra, animal);
        } else {
            aplicarIdentificacaoDeCampo(amostra, request);
        }
        aplicarDadosClinicos(amostra, request, sintomas);
        return amostra;
    }

    public void corrigir(AnimalAmostrado amostra, AmostraAnimalRequest request, Map<String, Sintoma> sintomas) {
        if (amostra.getAnimal() == null) {
            aplicarIdentificacaoDeCampo(amostra, request);
        }
        aplicarDadosClinicos(amostra, request, sintomas);
    }

    private void aplicarIdentificacaoDeCampo(AnimalAmostrado amostra, AmostraAnimalRequest request) {
        amostra.setEspecie(especieRepository.findByCodigo(request.especie())
                .orElseThrow(EspecieInvalidaException::new));
        amostra.setSexo(request.sexo());
        amostra.setRaca(request.raca());
        amostra.setColoracao(request.coloracao());
        amostra.setPelagem(request.pelagem());
        amostra.setIdadeAprox(request.idadeAprox());
        amostra.setPesoKg(request.pesoKg());
    }

    private static void aplicarDadosClinicos(AnimalAmostrado amostra, AmostraAnimalRequest request,
            Map<String, Sintoma> sintomas) {
        amostra.setStatusClinico(request.statusClinico());
        amostra.setTipoAbrigo(request.tipoAbrigo());
        amostra.setAlteracaoComportamental(request.alteracaoComportamental());
        amostra.setDataColeta(request.dataColeta());
        amostra.setMaterialBiologico(request.materialBiologico());
        amostra.setContatoHumano(request.contatoHumano());
        amostra.setNivelContato(request.nivelContato());
        amostra.setAgrediuHumano(request.agrediuHumano());
        amostra.setObservacoes(request.observacoes());
        amostra.setSintomas(new HashSet<>(request.sintomasOuVazio().stream().map(sintomas::get).toList()));
    }

    private static void copiarIdentificacaoDaFicha(AnimalAmostrado amostra, Animal animal) {
        amostra.setEspecie(animal.getEspecie());
        amostra.setSexo(animal.getSexo());
        amostra.setRaca(animal.getRaca());
        amostra.setColoracao(animal.getColoracao());
        amostra.setPelagem(animal.getPelagem());
        amostra.setIdadeAprox(animal.getIdadeAprox());
        amostra.setPesoKg(animal.getPesoKg());
    }
}
