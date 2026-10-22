package fixture.preautorizacao;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

// Fixture de PreAuthorizeSemArgumentosTest e PreAutorizacaoInterceptorTest:
// um @PreAuthorize que usa argumento do metodo, o caso que o
// PreAutorizacaoInterceptor nao sabe avaliar. Fica fora de com.siszoo para a
// aplicacao (e os testes de contexto) nunca carregarem este controller.
@RestController
public class ControllerComArgumentoNoPreAuthorize {

    @GetMapping("/fixture/{id}")
    @PreAuthorize("#id == authentication.name")
    public String comArgumento(@PathVariable String id) {
        return id;
    }

    @GetMapping("/fixture")
    public String semPreAuthorize() {
        return "ok";
    }
}
