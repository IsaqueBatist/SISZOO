package fixture.preautorizacao;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

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
