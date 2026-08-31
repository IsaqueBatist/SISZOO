package com.siszoo.animais.clinico.mapper;

import java.time.LocalDate;
import java.util.UUID;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.siszoo.animais.clinico.dto.VacinacaoResponse;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.usuarios.entity.Usuario;

@Mapper(componentModel = "spring")
public interface VacinacaoMapper {

    @Mapping(target = "animalId", source = "vacinacao.animal.id")
    @Mapping(target = "vacinaCodigo", source = "vacinacao.vacina.codigo")
    @Mapping(target = "vacinaNome", source = "vacinacao.vacina.nome")
    @Mapping(target = "aplicadoPorId", source = "vacinacao.aplicadoPor.id")
    @Mapping(target = "aplicadoPorNome", source = "vacinacao.aplicadoPor", qualifiedByName = "nomeCompleto")
    @Mapping(target = "dataValidade", expression = "java(calcularDataValidade(vacinacao))")
    @Mapping(target = "retificaId", source = "vacinacao.retifica.id")
    @Mapping(target = "retificadoPorId", source = "retificadoPorId")
    @Mapping(target = "statusRegistro", expression = "java(retificadoPorId != null ? \"RETIFICADO\" : \"ATIVO\")")
    VacinacaoResponse toResponse(Vacinacao vacinacao, UUID retificadoPorId);

    @Named("nomeCompleto")
    default String nomeCompleto(Usuario usuario) {
        return usuario == null ? null : usuario.getNome() + " " + usuario.getSobrenome();
    }

    // DER.md: data_validade = data_aplicacao + intervalo da vacina. Nao e
    // coluna persistida (evita campo derivado que fica desatualizado); fica
    // null se a vacina do catalogo ainda nao tiver intervalo_meses definido.
    default LocalDate calcularDataValidade(Vacinacao vacinacao) {
        if (vacinacao.getVacina() == null
                || vacinacao.getVacina().getIntervaloMeses() == null
                || vacinacao.getDataAplicacao() == null) {
            return null;
        }
        return vacinacao.getDataAplicacao().plusMonths(vacinacao.getVacina().getIntervaloMeses());
    }
}
