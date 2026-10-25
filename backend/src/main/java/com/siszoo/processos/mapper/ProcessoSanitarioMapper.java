package com.siszoo.processos.mapper;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;

import com.siszoo.comum.dto.CatalogoItemResponse;
import com.siszoo.processos.dto.AmostraAnimalResponse;
import com.siszoo.processos.dto.ProcessoAuditoriaSnapshot;
import com.siszoo.processos.dto.ProcessoResumoResponse;
import com.siszoo.processos.dto.ProcessoSanitarioResponse;
import com.siszoo.processos.dto.ResponsavelProcessoResponse;
import com.siszoo.processos.dto.ResultadoProcessoResponse;
import com.siszoo.processos.entity.AnimalAmostrado;
import com.siszoo.processos.entity.DesfechoAnimal;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.ResponsavelProcesso;
import com.siszoo.processos.entity.ResultadoProcesso;
import com.siszoo.processos.entity.Sintoma;
import com.siszoo.usuarios.entity.Usuario;

// Mapeamento do processo sanitario para resposta, resumo e snapshot de
// auditoria. Como em OcorrenciaMapper, recebe tudo ja carregado (responsavel,
// amostras, registros de resultado): quem consulta o banco e o service.
@Mapper(componentModel = "spring")
public interface ProcessoSanitarioMapper {

    default ProcessoSanitarioResponse toResponse(ProcessoSanitario processo, ResponsavelProcesso responsavel,
            List<AmostraAnimalResponse> amostras, List<ResultadoProcesso> registrosDeResultado) {
        return new ProcessoSanitarioResponse(
                processo.getId(),
                processo.getProtocolo(),
                processo.getDataAbertura(),
                ocorrenciaIdDe(processo),
                ocorrenciaProtocoloDe(processo),
                processo.isUrgente(),
                processo.getStatusProcesso(),
                new CatalogoItemResponse(processo.getDoenca().getCodigo(), processo.getDoenca().getNome()),
                processo.getCid(),
                new CatalogoItemResponse(processo.getLaboratorio().getCodigo(), processo.getLaboratorio().getNome()),
                processo.getObservacoes(),
                responsavel == null ? null : toResponsavelResponse(responsavel),
                amostras,
                processo.getCriadoEm(),
                processo.getResultadoLaboratorial() == null ? null : new CatalogoItemResponse(
                        processo.getResultadoLaboratorial().getCodigo(), processo.getResultadoLaboratorial().getNome()),
                processo.getDataResultado(),
                catalogoDeDesfecho(processo),
                cadeiaDeResultados(registrosDeResultado),
                processo.getDataNotificacaoMunicipe(),
                processo.getGalNumero(),
                processo.getSinanNumero());
    }

    default ProcessoResumoResponse toResumo(ProcessoSanitario processo) {
        return new ProcessoResumoResponse(
                processo.getId(),
                processo.getProtocolo(),
                processo.getDataAbertura(),
                new CatalogoItemResponse(processo.getDoenca().getCodigo(), processo.getDoenca().getNome()),
                processo.getStatusProcesso(),
                processo.isUrgente(),
                ocorrenciaIdDe(processo),
                ocorrenciaProtocoloDe(processo));
    }

    // Sem o responsavel: nenhum dado pessoal no evento (como a D23).
    default ProcessoAuditoriaSnapshot toSnapshot(ProcessoSanitario processo, List<AmostraAnimalResponse> amostras) {
        return new ProcessoAuditoriaSnapshot(
                processo.getId(),
                processo.getProtocolo(),
                processo.getDataAbertura(),
                ocorrenciaIdDe(processo),
                processo.isUrgente(),
                processo.getStatusProcesso(),
                processo.getDoenca().getCodigo(),
                processo.getCid(),
                processo.getLaboratorio().getCodigo(),
                processo.getObservacoes(),
                amostras,
                processo.getResultadoLaboratorial() == null ? null : processo.getResultadoLaboratorial().getCodigo(),
                processo.getDataResultado(),
                processo.getDesfechoAnimal() == null ? null : processo.getDesfechoAnimal().getCodigo());
    }

    default AmostraAnimalResponse toAmostraResponse(AnimalAmostrado amostra) {
        return new AmostraAnimalResponse(
                amostra.getId(),
                amostra.getAnimal() == null ? null : amostra.getAnimal().getId(),
                new CatalogoItemResponse(amostra.getEspecie().getCodigo(), amostra.getEspecie().getNome()),
                amostra.getSexo(),
                amostra.getRaca(),
                amostra.getColoracao(),
                amostra.getPelagem(),
                amostra.getIdadeAprox(),
                amostra.getPesoKg(),
                amostra.getStatusClinico(),
                amostra.getTipoAbrigo(),
                amostra.getAlteracaoComportamental(),
                amostra.getDataColeta(),
                amostra.getMaterialBiologico(),
                amostra.isContatoHumano(),
                amostra.getNivelContato(),
                amostra.getAgrediuHumano(),
                amostra.getObservacoes(),
                amostra.getSintomas().stream()
                        .sorted(Comparator.comparing(Sintoma::getNome))
                        .map(s -> new CatalogoItemResponse(s.getCodigo(), s.getNome()))
                        .toList());
    }

    private static ResponsavelProcessoResponse toResponsavelResponse(ResponsavelProcesso responsavel) {
        return new ResponsavelProcessoResponse(
                responsavel.getId(),
                responsavel.getNome(),
                responsavel.getCpf(),
                responsavel.getTelefone(),
                responsavel.getEmail(),
                responsavel.getCep(),
                responsavel.getEndereco(),
                responsavel.getBairroResidencial(),
                responsavel.getBairroOcorrencia());
    }

    // Historico em ordem de cadeia: o original e, a seguir, cada correcao da
    // anterior (V14 garante um original e no maximo uma correcao por linha).
    private static List<ResultadoProcessoResponse> cadeiaDeResultados(List<ResultadoProcesso> registros) {
        Map<UUID, ResultadoProcesso> correcaoDe = registros.stream()
                .filter(r -> r.getRetifica() != null)
                .collect(Collectors.toMap(r -> r.getRetifica().getId(), Function.identity()));
        List<ResultadoProcessoResponse> cadeia = new ArrayList<>();
        ResultadoProcesso atual = registros.stream().filter(r -> r.getRetifica() == null).findFirst().orElse(null);
        while (atual != null) {
            cadeia.add(toResultadoResponse(atual));
            atual = correcaoDe.get(atual.getId());
        }
        return cadeia;
    }

    private static ResultadoProcessoResponse toResultadoResponse(ResultadoProcesso registro) {
        Usuario autor = registro.getRegistradoPor();
        return new ResultadoProcessoResponse(
                registro.getId(),
                new CatalogoItemResponse(registro.getResultadoLaboratorial().getCodigo(),
                        registro.getResultadoLaboratorial().getNome()),
                registro.getDataResultado(),
                registro.getObservacoes(),
                registro.getRetifica() == null ? null : registro.getRetifica().getId(),
                autor.getId(),
                autor.nomeCompleto(),
                registro.getRegistradoEm());
    }

    private static UUID ocorrenciaIdDe(ProcessoSanitario processo) {
        return processo.getOcorrencia() == null ? null : processo.getOcorrencia().getId();
    }

    private static String ocorrenciaProtocoloDe(ProcessoSanitario processo) {
        return processo.getOcorrencia() == null ? null : processo.getOcorrencia().getProtocolo();
    }

    private static CatalogoItemResponse catalogoDeDesfecho(ProcessoSanitario processo) {
        DesfechoAnimal desfecho = processo.getDesfechoAnimal();
        return desfecho == null ? null : new CatalogoItemResponse(desfecho.getCodigo(), desfecho.getNome());
    }
}
