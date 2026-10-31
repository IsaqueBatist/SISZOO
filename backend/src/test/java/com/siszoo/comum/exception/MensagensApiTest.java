package com.siszoo.comum.exception;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.greaterThan;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

// Guarda da revisao de mensagens (decisao de 31/10/2026): todo texto que a API
// devolve ao usuario esta em portugues, com acento, e sem termo interno. Le o
// fonte, porque boa parte das mensagens so aparece em cenarios raros.
class MensagensApiTest {

    private static final Path FONTES = Path.of("src/main/java/com/siszoo");

    private static final List<Pattern> ORIGENS = List.of(
            Pattern.compile("super\\(\\s*HttpStatus\\.[A-Z_]+,\\s*((?:\"(?:[^\"\\\\]|\\\\.)*\"\\s*\\+?\\s*)+)\\)"),
            Pattern.compile("new CampoInvalidoException\\(\\s*\"[^\"]*\",\\s*\"((?:[^\"\\\\]|\\\\.)*)\""),
            Pattern.compile("message\\s*=\\s*\"((?:[^\"\\\\]|\\\\.)*)\""),
            Pattern.compile("new ErroResponse\\(\\s*\"((?:[^\"\\\\]|\\\\.)*)\""));

    // Palavras que, em portugues correto, levam acento: sem ele, o texto veio de
    // alguem digitando sem acentuar.
    private static final Pattern SEM_ACENTO = Pattern.compile("(?iu)(?<![\\p{L}])(nao|sao|ja|so|ate|apos|invalid[oa]s?|"
            + "obrigatori[oa]s?|usuarios?|ocorrencias?|denuncias?|sanitario|maximo|minimo|periodo|especie|providencia|"
            + "municipe|vacinacao|prescricao|castracao|implantacao|aplicacao|solicitacao|transicao|medio|femea|"
            + "numero|nivel|agressao|inicio|termino|urgencia|doenca|laboratorio|notificacao|critic[oa]s?)(?![\\p{L}])");

    private static final Pattern TERMO_INTERNO = Pattern.compile(
            "(?i)exception|stack|sql|null|retificaId|COM_RESULTADO|SMTP|constraint|entity|[a-z]+_[a-z]+");

    private static final Pattern EM_INGLES = Pattern.compile("(?i)\\b(invalid|denied|error|failed|not found|must|required)\\b");

    private record Mensagem(String arquivo, String texto) {
    }

    private static List<Mensagem> mensagens() throws IOException {
        List<Mensagem> encontradas = new ArrayList<>();
        try (Stream<Path> arquivos = Files.walk(FONTES)) {
            for (Path arquivo : arquivos.filter(p -> p.toString().endsWith(".java")).toList()) {
                String fonte = Files.readString(arquivo, StandardCharsets.UTF_8);
                for (Pattern origem : ORIGENS) {
                    Matcher achado = origem.matcher(fonte);
                    while (achado.find()) {
                        encontradas.add(new Mensagem(arquivo.getFileName().toString(), achado.group(1)));
                    }
                }
            }
        }
        return encontradas;
    }

    @Test
    @DisplayName("a varredura encontra as mensagens da API")
    void varreduraFunciona() throws IOException {
        assertThat(mensagens().size(), greaterThan(100));
    }

    @Test
    @DisplayName("mensagens em portugues brasileiro, com acento")
    void semPalavraSemAcento() throws IOException {
        assertThat(mensagens().stream()
                .filter(mensagem -> SEM_ACENTO.matcher(mensagem.texto()).find())
                .map(Mensagem::toString)
                .toList(), empty());
    }

    @Test
    @DisplayName("mensagens sem ingles e sem detalhes internos")
    void semTermoInterno() throws IOException {
        assertThat(mensagens().stream()
                .filter(mensagem -> TERMO_INTERNO.matcher(mensagem.texto()).find()
                        || EM_INGLES.matcher(mensagem.texto()).find())
                .map(Mensagem::toString)
                .toList(), empty());
    }
}
