package com.siszoo.comum.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;

public final class BuscaTexto {

    private static final char ESCAPE = '\\';
    private static final String COM_ACENTO = "áàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ";
    private static final String SEM_ACENTO = "aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn";
    private static final Pattern MARCAS_DE_ACENTO = Pattern.compile("\\p{M}+");
    private static final Pattern CURINGAS = Pattern.compile("[\\\\%_]");

    private BuscaTexto() {
    }

    public static String padrao(String termo) {
        String semAcento = MARCAS_DE_ACENTO.matcher(Normalizer.normalize(termo.trim(), Normalizer.Form.NFD)).replaceAll("");
        return "%" + CURINGAS.matcher(semAcento.toLowerCase(Locale.ROOT)).replaceAll("\\\\$0") + "%";
    }

    public static Predicate contem(CriteriaBuilder cb, Expression<String> campo, String padrao) {
        Expression<String> semAcento = cb.function("translate", String.class, cb.lower(campo),
                cb.literal(COM_ACENTO), cb.literal(SEM_ACENTO));
        return cb.like(semAcento, padrao, ESCAPE);
    }
}
