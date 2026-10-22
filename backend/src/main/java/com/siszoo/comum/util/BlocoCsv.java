package com.siszoo.comum.util;

import java.util.List;

// Um relatorio pode ter varias secoes tabulares (ex.: "Aplicações por
// Vacina", "Animais com Vacinas Vencidas") — CsvWriter escreve cada bloco
// como um titulo + cabecalho + linhas, separados por uma linha em branco, no
// mesmo arquivo CSV.
public record BlocoCsv(String titulo, List<String> cabecalho, List<List<String>> linhas) {
}
