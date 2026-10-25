package com.siszoo.animais.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

// Campos da ficha que o cadastro e a edicao gravam do mesmo jeito
// (CriarAnimalRequest e AtualizarAnimalRequest). Microchip, medalha, laudo,
// foto, status e baia tem regra propria em cada caminho e ficam de fora.
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
}
