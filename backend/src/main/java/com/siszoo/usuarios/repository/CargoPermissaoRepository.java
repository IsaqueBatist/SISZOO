package com.siszoo.usuarios.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siszoo.usuarios.entity.CargoPermissao;

public interface CargoPermissaoRepository extends JpaRepository<CargoPermissao, UUID> {

    @Query("SELECT cp FROM CargoPermissao cp JOIN cp.cargo c WHERE c.nome IN :nomesCargos")
    List<CargoPermissao> findByCargoNomeIn(@Param("nomesCargos") Collection<String> nomesCargos);
}
