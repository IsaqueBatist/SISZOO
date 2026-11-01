package com.siszoo.animais.clinico.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.siszoo.animais.clinico.entity.Vacina;

public interface VacinaRepository extends JpaRepository<Vacina, UUID>, JpaSpecificationExecutor<Vacina> {

    // Usado por VacinacaoService.resolverVacina. Devolve tambem a inativa de
    // proposito: quem decide o que fazer com ela e o chamador (registro novo
    // recusa, retificacao do mesmo codigo aceita).
    Optional<Vacina> findByCodigo(String codigo);

    // Usado por CatalogoAnimalService: o catalogo clinico so oferece vacina
    // ativa, entao desativar uma vacina ja a tira do select sem mais nada.
    List<Vacina> findByAtivoTrueOrderByNomeAsc();
}
