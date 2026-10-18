package com.siszoo.comum.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

// T37: notificacao de resultado roda fora da transacao de escrita
// (NotificacaoResultadoListener, @Async). Sem isso, @Async e ignorado e o
// listener rodaria na mesma thread/transacao do request.
@Configuration
@EnableAsync
public class AsyncConfig {
}
