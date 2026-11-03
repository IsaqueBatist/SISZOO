# Fotos pendentes dos animais novos da seed (#033–#050)

Checklist de trabalho para completar a revisão de 02/11/2026 do seed (ver `seed-dev.md`, SD-10). Os 18 animais
acrescentados ao `AnimaisSeed.PLANO` já estão no código e **têm arquivo**, mas o arquivo é uma **imagem provisória
gerada em código** (fundo de ruído com a legenda "FOTO PROVISORIA" e o nome do arquivo), não uma fotografia.

Consequências: o `./mvnw verify` passa e o seed roda, mas a listagem de animais, a ficha e as baias mostram essas
18 imagens provisórias em vez de fotos. Trocá-las **não exige mexer em código** — só substituir o arquivo mantendo
o nome.

Quando as 18 fotografias estiverem na pasta, este arquivo pode ser apagado, junto com a seção "Fotos provisórias"
do `CREDITOS.md`; os créditos definitivos vão para a tabela principal desse mesmo arquivo.

## Restrições que o teste verifica

| Regra | Valor |
|---|---|
| Nome do arquivo | exatamente o da coluna "Arquivo" abaixo (`^\d{3}-[a-z]+\.jpg$`, derivado de `ArquivosFicticios.nomeDaFoto`) |
| Formato | JPEG legível pelo `ImageIO` (extensão `.jpg` **e** conteúdo JPEG de verdade) |
| Tamanho em bytes | entre **10 000** e **200 000** |
| Dimensão | lado maior **≤ 800 px** (o padrão da pasta é 640 px) |
| Unicidade | nenhum nome de arquivo repetido no plano |
| Licença | **CC0 1.0** ou domínio público declarado pelo autor, do Wikimedia Commons |

Receita usada nas 32 fotos atuais: redimensionar para lado maior de 640 px e recomprimir em JPEG com qualidade 75%.

Nenhuma foto pode retratar um animal real do CCZ de Itu. A foto só precisa ser coerente com a espécie e, quando
possível, com a cor, a pelagem e o porte descritos no plano.

## Os 18 arquivos

| Arquivo | Animal | Espécie | Raça / tipo | Coloração | Pelagem | Porte |
|---|---|---|---|---|---|---|
| `033-sombra.jpg` | Sombra | Quiróptero | Morcego hematófago | Marrom | curta | pequeno |
| `034-breu.jpg` | Breu | Quiróptero | Morcego insetívoro | Preta | curta | pequeno |
| `035-noite.jpg` | Noite | Quiróptero | Morcego insetívoro | Marrom escura | curta | pequeno |
| `036-tiao.jpg` | Tião | Primata não-humano | Sagui-de-tufo-preto | Marrom e cinza | longa | pequeno |
| `037-juca.jpg` | Juca | Primata não-humano | Sagui-de-tufo-branco | Acinzentada | longa | pequeno |
| `038-pretinha.jpg` | Pretinha | Canino | SRD | Preta | curta | médio |
| `039-caramelo.jpg` | Caramelo | Canino | SRD | Caramelo | curta | médio |
| `040-nuvem.jpg` | Nuvem | Felino | SRD | Branca | curta | pequeno |
| `041-teimoso.jpg` | Teimoso | Canino | SRD | Malhada | curta | pequeno |
| `042-pinta.jpg` | Pinta | Felino | SRD | Malhada | curta | pequeno |
| `043-lola.jpg` | Lola | Canino | Beagle (mestiço) | Tricolor | curta | médio |
| `044-thiago.jpg` | Thiago | Felino | SRD | Laranja e branca | curta | pequeno |
| `045-branca.jpg` | Branca | Canino | SRD (idosa) | Branca | longa | médio |
| `046-jeca.jpg` | Jeca | Canino | SRD | Caramelo | curta | médio |
| `047-morena.jpg` | Morena | Felino | SRD (filhote) | Preta | curta | pequeno |
| `048-tufao.jpg` | Tufão | Canino | Husky (mestiço) | Cinza e branca | longa | grande |
| `049-serena.jpg` | Serena | Felino | SRD | Cinza azulada | curta | pequeno |
| `050-canela.jpg` | Canela | Canino | Boxer (mestiço) | Caramelo | curta | grande |

## Observações por espécie

- **Quirópteros (033–035).** Buscar no Commons por *Desmodus rotundus* (hematófago), *Molossus*, *Myotis* ou
  *Tadarida brasiliensis* (insetívoros). Filtrar por CC0; muita foto de morcego no Commons é CC BY-SA, que **não**
  serve para esta pasta. Foto de animal contido em luva de manejo é a mais fiel ao uso real do CCZ.
- **Saguis (036–037).** *Callithrix penicillata* (tufo preto) e *Callithrix jacchus* (tufo branco). A #029 (Chico,
  `029-chico.jpg`) já é um sagui-de-tufo-preto — escolher uma foto visivelmente diferente para o Tião.
- **Cães e gatos (038–050).** Mesma estratégia das 32 atuais: `commons.wikimedia.org` com filtro de licença CC0.
  Conferir a coloração: Lola é tricolor de Beagle, Branca é branca de pelagem longa, Tufão é Husky cinza e branca.

## Depois de colocar os arquivos

1. Substituir o arquivo provisório mantendo exatamente o nome da coluna "Arquivo".
2. Acrescentar uma linha por foto na tabela principal do `CREDITOS.md` (arquivo, animal, arquivo original com link,
   autor, licença), no mesmo formato das 32 existentes.
3. `cd backend && ./mvnw verify` — o `SeedPlanoTest` revalida as 50 fotos.
4. Recriar o banco do seed: a idempotência por `seed_controle` faz um banco já semeado **não** receber a foto nova
   (mesma ressalva da SD-9).
5. Quando as 18 estiverem trocadas, apagar este arquivo, a seção "Fotos provisórias" do `CREDITOS.md` e a menção a
   este arquivo no `seed-dev.md`.
