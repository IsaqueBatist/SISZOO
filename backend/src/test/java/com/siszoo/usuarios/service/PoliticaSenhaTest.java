package com.siszoo.usuarios.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

// Regras de complexidade da politica "Passwords must meet complexity
// requirements" (Windows), adaptadas ao SISZOO: nome da conta = parte do
// e-mail antes do @; nome de exibicao = nome + sobrenome.
class PoliticaSenhaTest {

    private static final String EMAIL = "erin.hagens@itu.sp.gov.br";
    private static final String NOME = "Erin M.";
    private static final String SOBRENOME = "Hagens";

    private static Optional<String> violacao(String senha) {
        return PoliticaSenha.violacao(senha, EMAIL, NOME, SOBRENOME);
    }

    // ── Categorias ───────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
            "Abcdefgh1",      // maiuscula + minuscula + digito
            "abcdefg1!",      // minuscula + digito + simbolo
            "ABCDEFG1!",      // maiuscula + digito + simbolo
            "Abcdefgh!",      // maiuscula + minuscula + simbolo
            "Ação-Útil",      // maiusculas e minusculas com acento + simbolo
            "Ωμέγα-Σύνολο",   // grego: maiuscula + minuscula + simbolo
            "Пароль-Тест",    // cirilico: maiuscula + minuscula + simbolo
            "密码密码ab12",    // letra sem caixa (ideograma) + minuscula + digito
    })
    @DisplayName("aceita senha com pelo menos 3 categorias")
    void categorias(String senha) {
        assertThat(violacao(senha)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "abcdefgh",        // so minusculas
            "abcdefg1",        // minuscula + digito
            "ABCDEFG1",        // maiuscula + digito
            "Abcdefgh",        // maiuscula + minuscula
            "abcdefg€",        // moeda nao e simbolo da politica
            "abcd efgh",       // espaco nao e simbolo da politica
            "Senha\\Forte",    // barra invertida nao esta na lista da politica
            "١٢٣٤٥٦٧٨abc",     // digitos arabes nao sao "0 a 9"
    })
    @DisplayName("recusa senha com menos de 3 categorias")
    void menosDeTresCategorias(String senha) {
        assertThat(violacao(senha)).hasValueSatisfying(mensagem -> assertThat(mensagem).contains("3 tipos"));
    }

    @Test
    @DisplayName("simbolos da lista da politica contam como categoria")
    void simbolosDaPolitica() {
        for (char simbolo : "'-!\"#$%&()*,./:;?@[]^_`{|}~+<=>".toCharArray()) {
            assertThat(violacao("abcdefg1" + simbolo)).as("simbolo %s", simbolo).isEmpty();
        }
    }

    // ── Nome da conta (parte local do e-mail) ────────────

    @Test
    @DisplayName("recusa a parte local do e-mail inteira, sem diferenciar maiusculas")
    void nomeDaConta() {
        assertThat(violacao("X1!ERIN.HAGENS")).hasValueSatisfying(m -> assertThat(m).contains("nome da conta"));
        assertThat(violacao("pre-erin.hagens-9")).hasValueSatisfying(m -> assertThat(m).contains("nome da conta"));
    }

    @Test
    @DisplayName("nome da conta com menos de 3 caracteres nao e checado")
    void nomeDaContaCurto() {
        assertThat(PoliticaSenha.violacao("Xy1!xyZw", "xy@itu.sp.gov.br", "Ana", "Lu")).isEmpty();
    }

    // ── Nome de exibicao ─────────────────────────────────

    @Test
    @DisplayName("exemplo da politica: 'Erin M. Hagens' recusa 'erin' e 'hagens'; 'M' e ignorado")
    void exemploDaPolitica() {
        assertThat(violacao("Senha-erin-1")).hasValueSatisfying(m -> assertThat(m).contains("nome do usuario"));
        assertThat(violacao("HAGENS2026!")).hasValueSatisfying(m -> assertThat(m).contains("nome do usuario"));
        assertThat(violacao("Mm-Forte-2026")).isEmpty();
    }

    @Test
    @DisplayName("substrings das partes do nome nao sao checadas")
    void substringDaParte() {
        // "eri" e "hag" sao pedacos de "Erin"/"Hagens", nao partes inteiras.
        assertThat(violacao("Eri-Hag-2026")).isEmpty();
    }

    @Test
    @DisplayName("divide o nome em virgula, ponto, hifen, sublinhado, espaco, cerquilha e tab")
    void delimitadores() {
        String nome = "Ana,Beatriz.Carla-Diana_Elisa#Fabia\tGlauce";
        for (String parte : new String[] {"beatriz", "carla", "diana", "elisa", "fabia", "glauce"}) {
            assertThat(PoliticaSenha.violacao("X9!" + parte, "x.y@itu.sp.gov.br", nome, "Silva"))
                    .as("parte %s", parte).isPresent();
        }
        // "Ana" tem 3 caracteres: tambem e checada.
        assertThat(PoliticaSenha.violacao("X9!ana", "x.y@itu.sp.gov.br", nome, "Silva")).isPresent();
    }

    @Test
    @DisplayName("parte do nome com acento e checada sem diferenciar maiusculas")
    void nomeComAcento() {
        assertThat(PoliticaSenha.violacao("JOÃO-2026!", "j.silva@itu.sp.gov.br", "João", "Silva")).isPresent();
    }
}
