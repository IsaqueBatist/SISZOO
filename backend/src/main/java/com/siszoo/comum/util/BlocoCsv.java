package com.siszoo.comum.util;

import java.util.List;

public record BlocoCsv(String titulo, List<String> cabecalho, List<List<String>> linhas) {
}
