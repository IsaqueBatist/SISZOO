package com.siszoo.alertas.mapper;

import java.time.LocalDate;
import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.siszoo.alertas.dto.AlertaVacinalAnimalResponse;
import com.siszoo.alertas.dto.AlertaVacinalItemResponse;
import com.siszoo.alertas.dto.SeveridadeAlerta;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.entity.Animal;
import com.siszoo.usuarios.entity.Usuario;

@Mapper(componentModel = "spring")
public interface AlertaVacinalMapper {

    @Mapping(target = "vacinacaoId", source = "vacinacao.id")
    @Mapping(target = "vacinaId", source = "vacinacao.vacina.id")
    @Mapping(target = "vacinaNome", source = "vacinacao.vacina.nome")
    @Mapping(target = "dataAplicacao", source = "vacinacao.dataAplicacao")
    @Mapping(target = "veterinarioNome", source = "vacinacao.aplicadoPor", qualifiedByName = "nomeCompleto")
    AlertaVacinalItemResponse toItem(
            Vacinacao vacinacao, LocalDate dataValidade, long diasRestantes, SeveridadeAlerta severidade);

    @Mapping(target = "animalId", source = "animal.id")
    @Mapping(target = "animalNome", source = "animal.nome")
    @Mapping(target = "animalMicrochip", source = "animal.microchip")
    @Mapping(target = "animalEspecieNome", source = "animal.especie.nome")
    @Mapping(target = "animalSexo", source = "animal.sexo")
    @Mapping(target = "animalBaiaNome", source = "animal.baia.nome")
    AlertaVacinalAnimalResponse toAnimalResponse(Animal animal, List<AlertaVacinalItemResponse> vacinas);

    @Named("nomeCompleto")
    default String nomeCompleto(Usuario usuario) {
        return usuario == null ? null : usuario.getNome() + " " + usuario.getSobrenome();
    }
}
