package com.siszoo.comum.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

// Liga o @Scheduled. Unico uso hoje: expurgo diario dos tokens de recuperacao
// de senha vencidos (RecuperacaoSenhaService.expurgarVencidos). O agendador
// padrao do Boot (uma thread) basta para tarefas curtas de madrugada.
@Configuration
@EnableScheduling
public class AgendamentoConfig {
}
