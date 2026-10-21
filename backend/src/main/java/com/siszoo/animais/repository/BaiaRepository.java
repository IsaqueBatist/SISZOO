package com.siszoo.animais.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siszoo.animais.entity.Baia;

import jakarta.persistence.LockModeType;

public interface BaiaRepository extends JpaRepository<Baia, UUID>, JpaSpecificationExecutor<Baia> {

    // Quem vai ocupar uma vaga trava a baia ate o fim da transacao: a
    // contagem de ocupacao e a gravacao do animal ficam serializadas entre
    // cadastros e edicoes simultaneos (AnimalService.resolverBaia).
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Baia b WHERE b.id = :id")
    Optional<Baia> findByIdForUpdate(@Param("id") UUID id);

    // Alerta "baia_superlotada" (com.siszoo.relatorios, T38): base para o
    // service comparar ocupacao (AnimalRepository#contarOcupacaoPorBaia) com
    // capacidade — so baias ativas entram na contagem, mesmo criterio de
    // "superlotada" ja usado em BaiaService#mapearComOcupacao (>= capacidade).
    List<Baia> findByAtivaTrue();
}
