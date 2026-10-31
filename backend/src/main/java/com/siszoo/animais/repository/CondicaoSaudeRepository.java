package com.siszoo.animais.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.entity.CondicaoSaude;

public interface CondicaoSaudeRepository extends JpaRepository<CondicaoSaude, UUID> {

    List<CondicaoSaude> findByCodigoIn(Collection<String> codigos);

    List<CondicaoSaude> findByAtivoTrueOrderByNomeAsc();
}
