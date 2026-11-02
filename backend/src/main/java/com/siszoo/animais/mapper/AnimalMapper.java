package com.siszoo.animais.mapper;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

import org.mapstruct.InheritConfiguration;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.siszoo.animais.dto.AnimalResponse;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.entity.CondicaoSaude;
import com.siszoo.comum.dto.CatalogoItemResponse;
import com.siszoo.usuarios.entity.Usuario;

@Mapper(componentModel = "spring")
public interface AnimalMapper {

    @Mapping(target = "especieCodigo", source = "especie.codigo")
    @Mapping(target = "especieNome", source = "especie.nome")
    @Mapping(target = "statusCodigo", source = "status.codigo")
    @Mapping(target = "statusNome", source = "status.nome")
    @Mapping(target = "motivoEntradaCodigo", source = "motivoEntrada.codigo")
    @Mapping(target = "motivoEntradaNome", source = "motivoEntrada.nome")
    @Mapping(target = "baiaId", source = "baia.id")
    @Mapping(target = "baiaNome", source = "baia.nome")
    @Mapping(target = "tipoBaiaNome", source = "baia", qualifiedByName = "tipoBaiaNome")
    @Mapping(target = "criadoPorId", source = "criadoPor.id")
    @Mapping(target = "criadoPorNome", source = "criadoPor", qualifiedByName = "nomeCompleto")
    @Mapping(target = "condicoes", source = "condicoes", qualifiedByName = "condicoesOrdenadas")
    AnimalResponse toResponse(Animal animal);

    // Listagens: o mesmo DTO, com a miniatura no lugar da foto inteira
    // em fotoUrl - so avatar na tela. @Named para nunca ser escolhido sozinho
    // no lugar de toResponse (detalhe, criacao, edicao, auditoria).
    @Named("listagem")
    @InheritConfiguration(name = "toResponse")
    @Mapping(target = "fotoUrl", source = "fotoMiniatura")
    @Mapping(target = "condicoes", ignore = true)
    AnimalResponse toResponseListagem(Animal animal);

    @Named("condicoesOrdenadas")
    default List<CatalogoItemResponse> condicoesOrdenadas(Set<CondicaoSaude> condicoes) {
        return condicoes.stream()
                .sorted(Comparator.comparing(CondicaoSaude::getNome))
                .map(condicao -> new CatalogoItemResponse(condicao.getCodigo(), condicao.getNome()))
                .toList();
    }

    @Named("tipoBaiaNome")
    default String tipoBaiaNome(Baia baia) {
        return baia == null ? null : baia.getTipoBaia().getNome();
    }

    @Named("nomeCompleto")
    default String nomeCompleto(Usuario usuario) {
        return usuario.nomeCompleto();
    }
}
