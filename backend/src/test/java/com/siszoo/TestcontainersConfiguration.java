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

// Um PostgreSQL por JVM e um database novo por contexto Spring. Antes, o
// container era um @Bean e cada contexto distinto em cache (15 na suite)
// subia o seu, todos vivos ate o fim da JVM. Agora o container sobe uma vez e
// cada contexto recebe um database vazio, que o Flyway da aplicacao migra do
// zero (V1..Vn) como antes: o isolamento entre contextos e o mesmo, so sem os
// containers repetidos. O Ryuk do Testcontainers remove o container no fim.
//
// max_connections: cada contexto em cache mantem o proprio pool Hikari (ate 10
// conexoes, o padrao, que os testes de concorrencia usam) ate o fim da JVM,
// agora todos no mesmo servidor; com os 100 do padrao do PostgreSQL, o 11o
// contexto falhava com "too many clients already".
//
// fsync/synchronous_commit/full_page_writes desligados: o banco e descartavel
// e nenhum teste exercita queda do servidor. Com um servidor so, o WAL dos 12
// contextos (cada um migrando V1..Vn) se acumula e os checkpoints caiam no
// meio dos testes de migracao. Transacoes, locks, constraints e triggers nao
// mudam: so a garantia de persistir em disco antes de responder ao commit.
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
