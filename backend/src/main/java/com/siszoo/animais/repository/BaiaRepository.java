package com.siszoo.animais.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.entity.Baia;

public interface BaiaRepository extends JpaRepository<Baia, UUID> {
}
