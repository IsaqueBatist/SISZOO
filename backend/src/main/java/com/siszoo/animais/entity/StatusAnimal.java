package com.siszoo.animais.entity;

import java.util.Set;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "status_animal")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class StatusAnimal {

    public static final Set<String> CODIGOS_SOB_CUSTODIA =
            Set.of("disponivel_adocao", "em_tratamento", "em_quarentena");
    public static final Set<String> CODIGOS_FORA_DA_CUSTODIA =
            Set.of("adotado", "obito_natural", "obito_eutanasia", "transferido");

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String codigo;

    @Column(nullable = false, length = 60)
    private String nome;
}
