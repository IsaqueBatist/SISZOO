package com.siszoo;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.boot.jdbc.autoconfigure.JdbcConnectionDetails;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer(DockerImageName.parse("postgres:16"))
			.withCommand("postgres", "-c", "max_connections=300", "-c", "fsync=off", "-c", "synchronous_commit=off",
					"-c", "full_page_writes=off");

	private static final AtomicInteger CONTEXTOS = new AtomicInteger();

	@Bean
	JdbcConnectionDetails jdbcConnectionDetails() {
		iniciar();
		String database = "siszoo_ctx_" + CONTEXTOS.incrementAndGet();
		executar("CREATE DATABASE " + database);
		String url = "jdbc:postgresql://" + POSTGRES.getHost() + ":"
				+ POSTGRES.getMappedPort(PostgreSQLContainer.POSTGRESQL_PORT) + "/" + database;
		return new JdbcConnectionDetails() {

			@Override
			public String getUsername() {
				return POSTGRES.getUsername();
			}

			@Override
			public String getPassword() {
				return POSTGRES.getPassword();
			}

			@Override
			public String getJdbcUrl() {
				return url;
			}
		};
	}

	private static synchronized void iniciar() {
		if (!POSTGRES.isRunning()) {
			POSTGRES.start();
		}
	}

	private static void executar(String sql) {
		try (Connection conexao = DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(),
				POSTGRES.getPassword());
				Statement comando = conexao.createStatement()) {
			comando.execute(sql);
		} catch (SQLException e) {
			throw new IllegalStateException("Nao foi possivel preparar o database de teste", e);
		}
	}

}
