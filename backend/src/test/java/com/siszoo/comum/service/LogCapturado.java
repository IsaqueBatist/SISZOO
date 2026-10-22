package com.siszoo.comum.service;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

// Eventos de um unico logger (T35), para os testes de e-mail conferirem o que
// o EmailService loga sem depender do console — onde GreenMail, Hibernate e
// Testcontainers tambem escrevem. Liga o DEBUG do logger enquanto captura e
// devolve o nivel anterior no close().
public final class LogCapturado implements AutoCloseable {

    private final Logger logger;
    private final Level nivelAnterior;
    private final ListAppender<ILoggingEvent> appender = new ListAppender<>();

    private LogCapturado(Class<?> origem) {
        logger = (Logger) LoggerFactory.getLogger(origem);
        nivelAnterior = logger.getLevel();
        logger.setLevel(Level.DEBUG);
        appender.start();
        logger.addAppender(appender);
    }

    public static LogCapturado de(Class<?> origem) {
        return new LogCapturado(origem);
    }

    // ListAppender guarda num ArrayList; o envio loga em outra thread.
    public List<ILoggingEvent> eventos() {
        synchronized (appender) {
            return new ArrayList<>(appender.list);
        }
    }

    public List<ILoggingEvent> doNivel(Level nivel) {
        return eventos().stream().filter(evento -> evento.getLevel() == nivel).toList();
    }

    /** Mensagens formatadas e, se houver, a mensagem do throwable de cada evento. */
    public List<String> textos(Level nivel) {
        return doNivel(nivel).stream().map(LogCapturado::texto).toList();
    }

    private static String texto(ILoggingEvent evento) {
        return evento.getThrowableProxy() == null
                ? evento.getFormattedMessage()
                : evento.getFormattedMessage() + " | " + evento.getThrowableProxy().getMessage();
    }

    @Override
    public void close() {
        logger.detachAppender(appender);
        appender.stop();
        logger.setLevel(nivelAnterior);
    }
}
