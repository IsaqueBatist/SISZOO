package com.siszoo.comum.exception;

import java.util.Map;

import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.webmvc.error.DefaultErrorAttributes;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.WebRequest;

@Component
public class AtributosDeErro extends DefaultErrorAttributes {

    @Override
    public Map<String, Object> getErrorAttributes(WebRequest webRequest, ErrorAttributeOptions options) {
        Map<String, Object> atributos = super.getErrorAttributes(webRequest, options);
        atributos.put("mensagem", mensagemPara((Integer) atributos.get("status")));
        return atributos;
    }

    private static String mensagemPara(Integer status) {
        if (status == null || status >= 500) {
            return "Não foi possível concluir a operação. Tente novamente em instantes. "
                    + "Se o problema continuar, fale com o Administrador do sistema.";
        }
        return switch (status) {
            case 400, 415 -> "Não foi possível processar os dados enviados. Verifique as informações e tente novamente.";
            case 404 -> "O recurso solicitado não foi encontrado.";
            case 405 -> "Esta operação não está disponível.";
            default -> "Não foi possível concluir a operação. Verifique as informações e tente novamente.";
        };
    }
}
