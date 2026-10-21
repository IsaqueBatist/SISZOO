package com.siszoo.comum.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

// T37: notificacao de resultado roda fora da transacao de escrita
// (NotificacaoResultadoListener, @Async). Sem isso, @Async e ignorado e o
// listener rodaria na mesma thread/transacao do request.
// T35: tambem e o que torna assincrono o EmailService.enviar. Executor: o
// applicationTaskExecutor do Boot (spring.task.execution no application.yml).
@Configuration
@EnableAsync
public class AsyncConfig {
}
