package com.siszoo.usuarios.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class PoliticaSenhaTest {

    private static final String EMAIL = "erin.hagens@itu.sp.gov.br";
    private static final String NOME = "Erin M.";
    private static final String SOBRENOME = "Hagens";

    private static Optional<String> violacao(String senha) {
        return PoliticaSenha.violacao(senha, EMAIL, NOME, SOBRENOME);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Abcdefgh1",
            "abcdefg1!",
            "ABCDEFG1!",
            "Abcdefgh!",
            "Ação-Útil",
            "Ωμέγα-Σύνολο",
            "Пароль-Тест",
            "密码密码ab12",
    })
    @DisplayName("aceita senha com pelo menos 3 categorias")
    void categorias(String senha) {
        assertThat(violacao(senha)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "abcdefgh",
            "abcdefg1",
            "ABCDEFG1",
            "Abcdefgh",
            "abcdefg€",
            "abcd efgh",
            "Senha\\Forte",
            "١٢٣٤٥٦٧٨abc",
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

    @Test
    @DisplayName("exemplo da politica: 'Erin M. Hagens' recusa 'erin' e 'hagens'; 'M' e ignorado")
    void exemploDaPolitica() {
        assertThat(violacao("Senha-erin-1")).hasValueSatisfying(m -> assertThat(m).contains("nome do usuário"));
        assertThat(violacao("HAGENS2026!")).hasValueSatisfying(m -> assertThat(m).contains("nome do usuário"));
        assertThat(violacao("Mm-Forte-2026")).isEmpty();
    }

    @Test
    @DisplayName("substrings das partes do nome nao sao checadas")
    void substringDaParte() {
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
        assertThat(PoliticaSenha.violacao("X9!ana", "x.y@itu.sp.gov.br", nome, "Silva")).isPresent();
    }

    @Test
    @DisplayName("parte do nome com acento e checada sem diferenciar maiusculas")
    void nomeComAcento() {
        assertThat(PoliticaSenha.violacao("JOÃO-2026!", "j.silva@itu.sp.gov.br", "João", "Silva")).isPresent();
    }
}
