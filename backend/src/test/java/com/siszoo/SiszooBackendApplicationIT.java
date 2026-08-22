package com.siszoo;

import com.siszoo.comum.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

// Smoke test de boot: unica cobertura que valida a subida do contexto Spring
// completo contra Postgres real (Testcontainers). Roda em `mvn verify`, nao em
// `mvn test`. Nao remover sem substituir a cobertura de boot.
class SiszooBackendApplicationIT extends AbstractIntegrationTest {

	@Test
	void contextLoads() {
	}

}
