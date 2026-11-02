package com.siszoo.animais.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface DadosDescritivosAnimal {

    String nome();

    String especie();

    String sexo();

    String raca();

    String coloracao();

    String pelagem();

    String porte();

    BigDecimal pesoKg();

    String idadeAprox();

    LocalDate dataNascimentoAprox();

    Boolean esterilizado();

    LocalDate dataEsterilizacao();

    String motivoEntrada();

    LocalDateTime dataEntrada();

    String observacoes();

    List<String> condicoes();

    String condicoesOutras();
}
