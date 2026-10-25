package com.siszoo.usuarios.service;

import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

// Complexidade de senha no modelo da politica "Passwords must meet complexity
// requirements" do Windows (Passfilt.dll), aplicada na criacao do usuario
// (senha inicial) e na troca de senha. Nao vale para o login nem para senhas
// ja gravadas, e nao vale para o admin do DataSeeder (senha do ambiente).
// O tamanho minimo (8) continua no @Size dos DTOs.
//
// - Nome da conta: o SISZOO nao tem samAccountName; o login e o e-mail, entao
//   vale a parte antes do "@", checada inteira, sem diferenciar maiusculas,
//   e ignorada se tiver menos de 3 caracteres.
// - Nome de exibicao (nome + sobrenome): dividido nos delimitadores da
//   politica; cada parte com 3 ou mais caracteres nao pode aparecer na senha
//   (sem diferenciar maiusculas; substrings das partes nao sao checadas).
// - Ao menos 3 das 5 categorias abaixo. Mantenha igual a
//   frontend/src/features/auth/utils/politicaSenha.ts.
public final class PoliticaSenha {

    // Virgula, ponto, traco/hifen, sublinhado, espaco, cerquilha e tab.
    private static final Pattern DELIMITADORES_NOME = Pattern.compile("[,.\\-\\u2010-\\u2015_ #\\t]+");
    private static final int TAMANHO_MINIMO_PARTE = 3;
    private static final int CATEGORIAS_EXIGIDAS = 3;
    // Lista exata da politica; simbolos de moeda nao contam.
    private static final String CARACTERES_ESPECIAIS = "'-!\"#$%&()*,./:;?@[]^_`{|}~+<=>";

    private PoliticaSenha() {
    }

    // Primeira regra violada, com a mensagem para o usuario, ou vazio.
    public static Optional<String> violacao(String senha, String email, String nome, String sobrenome) {
        String senhaMinuscula = minusculas(senha);

        String conta = email == null ? "" : email.substring(0, Math.max(email.indexOf('@'), 0));
        if (conta.length() >= TAMANHO_MINIMO_PARTE && senhaMinuscula.contains(minusculas(conta))) {
            return Optional.of("Senha nao pode conter o nome da conta (parte do e-mail antes do @)");
        }

        String nomeExibicao = (nome == null ? "" : nome) + " " + (sobrenome == null ? "" : sobrenome);
        for (String parte : DELIMITADORES_NOME.split(nomeExibicao)) {
            if (parte.length() >= TAMANHO_MINIMO_PARTE && senhaMinuscula.contains(minusculas(parte))) {
                return Optional.of("Senha nao pode conter partes do nome do usuario");
            }
        }

        if (categorias(senha) < CATEGORIAS_EXIGIDAS) {
            return Optional.of("Senha deve combinar ao menos 3 tipos de caractere: letras maiusculas, letras minusculas,"
                    + " digitos e simbolos");
        }
        return Optional.empty();
    }

    private static int categorias(String senha) {
        boolean maiuscula = false;
        boolean minuscula = false;
        boolean digito = false;
        boolean especial = false;
        boolean outraLetra = false;
        for (int i = 0; i < senha.length(); ) {
            int c = senha.codePointAt(i);
            i += Character.charCount(c);
            if (Character.isUpperCase(c)) {
                maiuscula = true;
            } else if (Character.isLowerCase(c)) {
                minuscula = true;
            } else if (c >= '0' && c <= '9') {
                digito = true;
            } else if (CARACTERES_ESPECIAIS.indexOf(c) >= 0) {
                especial = true;
            } else if (Character.isAlphabetic(c)) {
                // Letra sem maiuscula/minuscula (ex.: ideogramas asiaticos).
                outraLetra = true;
            }
        }
        return (maiuscula ? 1 : 0) + (minuscula ? 1 : 0) + (digito ? 1 : 0) + (especial ? 1 : 0)
                + (outraLetra ? 1 : 0);
    }

    private static String minusculas(String texto) {
        return texto.toLowerCase(Locale.ROOT);
    }
}
