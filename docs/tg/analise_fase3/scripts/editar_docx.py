# -*- coding: utf-8 -*-
"""Fase 3 — gera docs/tg/SISZOO_v2_alinhado.docx a partir da versão limpa (que NÃO é alterada).

Todas as edições de texto entram como controle de alterações (autor "Revisão SISZOO").
Cada edição cita o(s) ID(s) da matriz (F2-xxx) ou do achado da Fase 1 (F1-xxx) e é registrada
em docs/tg/analise_fase3/log_alteracoes_documento.md.

Uso:  py -3 -X utf8 editar_docx.py
"""
import os, sys, json, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docx_kit import DocxKit

RAIZ = r'C:\Users\isaqu\Desktop\codigo\SISZOO\docs\tg'
ORIG = os.path.join(RAIZ, 'SISZOO_versao_limpa.docx')
DEST = os.path.join(RAIZ, 'SISZOO_v2_alinhado.docx')
CAP = os.path.join(RAIZ, 'analise_fase3', 'capturas')
LOG = os.path.join(RAIZ, 'analise_fase3', 'log_alteracoes_documento.md')
TESTES = json.load(open(os.path.join(RAIZ, 'analise_fase3', 'contagem_testes.json'), encoding='utf-8'))

k = DocxKit(ORIG)
CORPO = 'Esta seção apresenta as telas do SISZOO implementado'   # parágrafo-modelo de corpo (pPr)

import re as _re
_LEGENDAS = {}
def _escopo(local, trecho, exato=None):
    """Edições em quadros ficam restritas ao trecho depois da legenda do quadro; anchors curtos exigem igualdade exata."""
    m = _re.match(r'Quadro (\d+)', local or '')
    apos = 0
    if m:
        q = int(m.group(1))
        if q not in _LEGENDAS:
            _LEGENDAS[q] = k.pos_legenda(f'Quadro {q} – ')
        apos = _LEGENDAS[q]
    if exato is None:
        exato = bool(m) and len(trecho) < 45
    return apos, exato

def S(trecho, novo, local, ids, oc=1, exato=None):
    apos, ex = _escopo(local, trecho, exato)
    k.substituir_paragrafo(trecho, novo, ocorrencia=oc, local=local, id_item=ids, apos=apos, exato=ex)

def R(trecho, novo, local, ids, oc=1, exato=None):
    apos, ex = _escopo(local, trecho, exato)
    k.substituir_run(trecho, novo, ocorrencia=oc, local=local, id_item=ids, apos=apos, exato=ex)

def L(ancora, celulas, local, ids, oc=1, exato=None):
    apos, ex = _escopo(local, ancora, exato)
    k.inserir_linha_tabela_apos(ancora, celulas, ocorrencia=oc, local=local, id_item=ids, apos=apos, exato=ex)

def N(legenda, texto, ids):
    k.inserir_nota_apos_quadro(legenda, texto, CORPO, id_item=ids)

def P(ancora, texto, local, ids, oc=1):
    k.inserir_paragrafo_apos(ancora, texto, ocorrencia=oc, local=local, id_item=ids)

TF = 'modelado; implementação prevista em trabalhos futuros'

# ============================================================ 2.2 Perfis
S('As permissões são registradas na entidade CargoPermissao',
  'O Quadro 4 apresenta os perfis de acesso do SISZOO e os módulos a que cada um tem acesso, conforme a regra de negócio RN09. '
  'A recepcionista participou da entrevista, mas o perfil de recepção não foi incluído no sistema, porque a recepção não executa as rotinas '
  'atendidas pelo SISZOO e utiliza sistema próprio para a gestão de consultas e cirurgias; a cirurgiã do CCZ, caso venha a utilizar o sistema, '
  'usará o perfil Veterinário. As permissões são registradas na entidade CargoPermissao, por módulo e por tipo de acesso (leitura, escrita e '
  'exclusão), em matriz fixa definida na carga inicial do banco; cada usuário recebe exatamente um cargo. A permissão granular '
  'denunciante_sigiloso, concedida aos cargos Administrador e Agente Sanitário, controla a visualização dos dados do denunciante em '
  'ocorrências sigilosas, e esse acesso é registrado na trilha de auditoria (RN03).',
  'Seção 2.2', 'F2-002, F2-025, F2-059, F2-582')
S('Todos, inclusive usuários, baias e trilha de auditoria',
  'Todos, inclusive usuários, baias e trilha de auditoria (tela de Logs)', 'Quadro 4', 'F2-027, F2-065')
S('Gestão de animais do canil; dashboard; baias e relatórios',
  'Gestão de animais do canil e baias (leitura e escrita); processos sanitários (leitura e escrita); dashboard e relatórios',
  'Quadro 4', 'F2-065, F2-005')
S('Processos sanitários; ocorrências; dashboard e relatórios',
  'Ocorrências (leitura e escrita, inclusive denunciante sigiloso); processos sanitários (leitura e escrita); gestão de animais (consulta); dashboard e relatórios',
  'Quadro 4', 'F2-065, F2-059')

# ============================================================ 2.3 Tecnologias
S('com o framework Spring Boot 3, que reduz',
  'O backend foi desenvolvido em Java 21, versão com suporte de longo prazo da plataforma Java SE (ORACLE, 2023), com o framework Spring Boot 4, '
  'que reduz a configuração necessária para criar aplicações Spring por meio de dependências pré-configuradas e de servidor web embutido '
  '(SPRING, 2026a). As dependências e a compilação do projeto são gerenciadas pelo Apache Maven (APACHE SOFTWARE FOUNDATION, 2026). '
  'A autenticação é sem estado (stateless): não há tabela de sessão, e a validade do token é verificada a cada requisição, inclusive a '
  'situação do usuário, de modo que o token de um usuário desativado deixa de ser aceito imediatamente.',
  'Seção 2.3.1', 'F2-126, F2-193, F2-561')
S('O frontend foi desenvolvido com React 18',
  'O frontend foi desenvolvido com React 19, biblioteca JavaScript para construção de interfaces a partir de componentes reutilizáveis '
  '(REACT, 2026), e com TypeScript, linguagem que acrescenta tipagem estática ao JavaScript e permite detectar erros ainda em tempo de '
  'desenvolvimento (MICROSOFT, 2026). O projeto é criado e compilado com o Vite, ferramenta que oferece servidor de desenvolvimento e gera, '
  'para produção, arquivos estáticos otimizados (VITE, 2026). A redução do tamanho dos arquivos enviados ao navegador contribui para o '
  'requisito de leveza (RNF02), cujo atendimento depende também do carregamento das telas sob demanda e da paginação das listas. As '
  'bibliotecas de navegação, comunicação com a API, validação de formulários e gráficos são apresentadas na Seção 5.1.',
  'Seção 2.3.2', 'F2-130')

# ============================================================ Quadro 5 (S8) e 3.5.2 Limitações
S('Robustez a falhas de rede e testes ponta a ponta (end-to-end).',
  'Robustez a falhas de rede (rascunhos locais) e ampliação dos testes de integração da API e de componentes; os testes ponta a ponta '
  '(end-to-end) não foram incorporados e passaram a trabalho futuro.', 'Quadro 5 (S8)', 'F2-154')
S('O escopo do trabalho está restrito ao Centro de Controle de Zoonoses do município de Itu',
  'O escopo do trabalho está restrito ao Centro de Controle de Zoonoses do município de Itu, o que limita a generalização direta dos '
  'resultados a outras unidades sem adaptação. O sistema também não contempla, nesta etapa, integração em tempo real com sistemas estaduais '
  'e federais de vigilância, como o SINAN (Sistema de Informação de Agravos de Notificação) e o GAL (Gerenciador de Ambiente Laboratorial); '
  'os números de notificação e de requisição são apenas registrados manualmente no processo sanitário, e as integrações ficam como trabalho '
  'futuro. Outras limitações da versão entregue: a saída do animal é registrada apenas pela mudança de status, sem campo específico de '
  'data de saída; o e-mail automático à Vigilância Epidemiológica (RN10) não foi implementado, por não haver endereço institucional '
  'definido; os anexos clínicos são vinculados ao animal, e não a cada vacinação, procedimento ou exame; e o uso de HTTPS e a rotina de '
  'backup diário (RNF04, RNF06) dependem do ambiente de implantação da Prefeitura.',
  'Seção 3.5.2', 'F2-008, F2-014, F2-007, F2-072, F2-074, F2-087, F2-329')

# ============================================================ Quadro 6 — Módulo 1
S('Login com e-mail institucional e senha, com troca de senha obrigatória no primeiro acesso.',
  'Login com e-mail institucional (domínio itu.sp.gov.br) e senha, com troca de senha obrigatória no primeiro acesso e troca de senha pelo '
  'próprio usuário; o usuário também atualiza o próprio telefone na tela de perfil. Autenticação sem estado por token JWT com prazo de '
  'validade; no logout o token é descartado no navegador, e o token de usuário desativado deixa de ser aceito imediatamente (RNF06).',
  'Quadro 6 (RF-C01)', 'F2-001, F2-559, F2-561')
S('Administrador cadastra, edita, desativa e reativa usuários',
  'Administrador cadastra, desativa e reativa usuários, atribuindo a cada um exatamente um cargo (Administrador, Veterinário ou Agente '
  'Sanitário), cujas permissões por módulo (leitura, escrita e exclusão) são fixas e definidas na carga inicial do banco. O Administrador não '
  'pode desativar a si mesmo. A edição dos dados cadastrais de outros usuários não foi implementada. Toda ação crítica gera AuditoriaEvento '
  '(RN06, RNF10).', 'Quadro 6 (RF-C02)', 'F2-002, F2-560')
L('O usuário ajusta o tema, densidade da interface',
  ['RF-C04', 'Trilha de Auditoria',
   'Administrador consulta a trilha de auditoria (AuditoriaEvento) na tela de Logs, com filtros por ação, entidade, módulo, usuário e período, '
   'em lista paginada com os valores anterior e posterior de cada evento (RNF10).', 'Média'],
  'Quadro 6 (novo RF-C04)', 'F2-027')

# ============================================================ Quadro 7 — Módulo 2
S('Registrar um animal com número do microchip (identificador único, RN01) e data de implantação do chip',
  'Registrar um animal com número do microchip (identificador único, RN01), data de implantação do chip, número da medalha (único quando '
  'informado), espécie, nome, raça, sexo, porte, pelagem, coloração, data de nascimento aproximada, idade aproximada, baia, foto, '
  'esterilizado, data de esterilização, observações, motivo de entrada, procedência, peso, status e data de entrada. O animal pode ser '
  'cadastrado sem microchip, que é registrado quando implantado; a ficha é marcada como completa quando possui os campos obrigatórios, o '
  'microchip e vacinação vigente (RN07).', 'Quadro 7 (RF-A01)', 'F2-004, F2-563, F2-609')
S('Visualizar e filtrar a listagem de animais por baia (BAIA 1–16 internas',
  'Visualizar e filtrar a listagem de animais por nome ou microchip, espécie, status e baia. A tela de baias exibe a ocupação atual, '
  'calculada pela contagem de animais alojados, a capacidade e a indicação de superlotação. Administrador e Veterinário cadastram e editam '
  'as baias (nome, tipo — interna, externa ou gatil —, capacidade, finalidade e situação); a exclusão lógica é restrita ao Administrador. '
  'Não há nomes de baias fixos: as baias são cadastradas pelo CCZ.', 'Quadro 7 (RF-A02)', 'F2-005, F2-565')
S('Gerar alertas automáticos na tela inicial listando os animais com reforço vacinal nos próximos 7 dias',
  'Gerar alertas automáticos na tela inicial listando os animais com reforço vacinal nos próximos 7 dias (severidade “a vencer”) e as '
  'vacinas vencidas (severidade “vencida”), com base na data de validade de cada dose, calculada a partir da data de aplicação e da validade '
  'da vacina.', 'Quadro 7 (RF-A03)', 'F2-594, F2-349')
S('Registrar e exibir o histórico completo de vacinações, prescrições, procedimentos, exames e anexos.',
  'Registrar e exibir o histórico de vacinações, prescrições, procedimentos e exames do animal, além de anexos (JPG, PNG ou PDF, até 5 MB, '
  'no máximo 10 por animal) vinculados à ficha do animal. Registros clínicos são imutáveis: a correção gera novo registro que retifica o '
  'anterior (retifica_id), com auditoria (RN06, RNF10). O catálogo de medicamentos e categorias farmacológicas usado nas prescrições é '
  'mantido em tela própria.', 'Quadro 7 (RF-A04)', 'F2-007, F2-564, F2-610')
S('Registrar a procedência ao entrar e o destino e a data de saída ao sair',
  'Registrar a procedência ao entrar e o destino ao sair, por mudança de status (Adotado, Óbito natural, Óbito eutanásia ou Transferido). '
  'No destino Óbito eutanásia, é obrigatório o laudo do responsável técnico que a justifica (Lei nº 14.228/2021, art. 2º, § 1º). A data '
  'específica de saída não é registrada (limitação, Seção 3.5.2). O registro dos dados do adotante e da devolução (entidade Adocao) está '
  'modelado, com implementação prevista em trabalhos futuros. Histórico imutável (RN06).', 'Quadro 7 (RF-A05)', 'F2-008, F2-167, F2-329')

# ============================================================ Quadro 8 — Módulo 3
S('Registrar ocorrência com protocolo (0000/AAAA, RN02), tipo, bairro',
  'Registrar ocorrência com protocolo (NNN/AAAA, RN02), tipo, data e hora de abertura, endereço, bairro, ponto de referência, descrição, '
  'urgente, sigilosa (RN03) ou anônima (sem denunciante), denunciante, denunciado (opcional), anexos (JPG, PNG ou PDF, até 5 MB) e '
  'movimentações.', 'Quadro 8 (RF-E01)', 'F2-058, F2-568, F2-571')
S('Consultar por protocolo, período, tipo, denunciante, bairro e status.',
  'Consultar por tipo, status, período da data de abertura e busca livre por protocolo, bairro ou denunciante. Em ocorrências sigilosas, os '
  'dados do denunciante são mascarados no servidor para perfis sem a permissão denunciante_sigiloso (Administrador e Agente Sanitário a '
  'possuem), e o acesso a esses dados é registrado em auditoria (RN03).', 'Quadro 8 (RF-E02)', 'F2-010, F2-059')
S('Encerrar com providência tomada, descrição (obrigatória quando a providência for',
  'Encerrar com providência tomada, descrição (obrigatória quando a providência for “Outro”) e data. Somente Agente Sanitário ou '
  'Administrador. Não pode ser encerrada enquanto houver processo sanitário vinculado não concluído (RN05). Registro imutável após '
  'encerramento (RN06).', 'Quadro 8 (RF-E03)', 'F2-011, F2-061')

# ============================================================ Quadro 9 — Módulo 4
S('Criar processo sanitário com protocolo (0000/AAAA, RN02), número do GAL',
  'Criar processo sanitário com protocolo (NNN/AAAA, RN02), números do GAL e do SINAN (opcionais, registro manual), urgente, data de '
  'abertura, status (RN12), doença, laboratório, observações, responsável, amostras e vínculo opcional a uma ocorrência, definido na '
  'abertura ou acrescentado depois a partir da ocorrência, e imutável depois de definido. Resultado laboratorial e desfecho são lançados em '
  'etapa posterior (RF-B03).', 'Quadro 9 (RF-B01)', 'F2-012, F2-058, F2-570')
S('Consultar processos por protocolo, período, doença, responsável, bairro e status.',
  'Consultar processos com filtros por doença e status, com os urgentes fixados no topo (RN04). Filtros por protocolo, período, responsável '
  'e bairro são melhoria prevista.', 'Quadro 9 (RF-B02)', 'F2-013')
S('Registrar resultado (Negativo/Positivo/Material Inadequado/Inconclusivo/Não Realizado/Aguardando) e desfecho.',
  'Registrar resultado (Aguardando, Positivo, Negativo, Inconclusivo, Material Inadequado ou Não Realizado) e desfecho do animal, em '
  'histórico imutável (ResultadoProcesso): a correção gera novo registro, e o resultado Positivo é definitivo. Resultado Positivo ou '
  'Inconclusivo notifica por e-mail o responsável, uma única vez, com reenvio manual permitido (RN10). A notificação à Vigilância '
  'Epidemiológica não foi implementada (pendência registrada em RN10).', 'Quadro 9 (RF-B03)', 'F2-014, F2-573, F2-574, F2-597')
S('Registrar os dados do animal amostrado (AmostraAnimal), vinculado a um animal do canil ou com dados próprios',
  'Registrar os dados do animal amostrado (AmostraAnimal, tabela animal_amostrado), vinculado a um animal do canil ou com dados próprios: '
  'espécie, sexo, raça, coloração, pelagem, idade aproximada, peso, estado clínico (sintomático, assintomático ou óbito), tipo de abrigo, '
  'material biológico, data da coleta, contato humano (RN04), nível de contato, agrediu humano, alterações comportamentais e sintomas.',
  'Quadro 9 (RF-B04)', 'F2-015, F2-593')
S('Gerar PDF do processo com controle de estado em DocumentoProcesso',
  'Gerar PDF do processo com controle de estado em DocumentoProcesso (Pendente→Em Processamento→Concluído/Falha). Requisito ' + TF + '.',
  'Quadro 9 (RF-B06)', 'F2-017')

# ============================================================ Quadro 10 — Módulo 5
S('Exibir em tempo real: total por StatusAnimal, ocupação de baias',
  'Exibir, com atualização a cada 5 minutos (cache), os indicadores do CCZ: total de animais por espécie, percentual de animais vacinados, '
  'ocorrências registradas no dia, alertas (reforço vacinal em 7 dias, vacinas vencidas, animais sem avaliação há 30 dias, baias '
  'superlotadas e fichas incompletas) e gráficos de evolução.', 'Quadro 10 (RF-D01)', 'F2-019, F2-566, F2-578, F2-589')
S('Gerar, em PDF e CSV, os relatórios de ocorrências por bairro, ocupação de baias, procedimentos, adoções, anual de processos e vacinação, por meio de RelatorioGerado',
  'Gerar, em PDF e CSV, os relatórios de ocorrências por bairro, ocupação de baias, procedimentos, adoções, anual de processos e vacinação, '
  'de forma síncrona na central de relatórios, com pré-visualização em tela. Cada exportação é registrada em RelatorioGerado (histórico de '
  'exportações com identificador DOC-AAAA-NNNN), sem armazenar o arquivo no banco (RN11).', 'Quadro 10 (RF-D02)', 'F2-020, F2-576')

# ============================================================ Quadro 11 — Relatórios
S('Histórico mensal de ocupação por baia, transferências internas e taxa média de superlotação.',
  'Ocupação atual por baia (capacidade, ocupação e situação), ocupação média, baias no limite ou superlotadas e capacidade total. '
  'Histórico mensal e transferências internas não são registrados.', 'Quadro 11 (Ocupação de Baias)', 'F2-095, F2-032')
S('Adoções realizadas, tempo médio de permanência, perfil dos adotantes e taxa de devolução.',
  'Quantidade atual de animais com status Adotado e seu perfil por espécie e porte. Tempo de permanência, dados do adotante e devoluções '
  'dependem da entidade Adocao (' + TF + ').', 'Quadro 11 (Adoções)', 'F2-097')
S('Animais vacinados, vacinas vencidas e próximas a vencer, por espécie, baia e veterinário responsável.',
  'Vacinas aplicadas no período, percentual de animais vacinados, vacinas vencidas e a vencer em 30 dias; aplicações por vacina e por '
  'veterinário; animais com vacinas vencidas, com baia e dias de atraso.', 'Quadro 11 (Vacinação)', 'F2-099, F2-577')
S('Concentração de ocorrências por bairro, apresentada em mapa de calor tabular',
  'Ocorrências registradas no período, bairros atingidos, tipo predominante e tempo médio de atendimento por bairro, tipos de ocorrência e '
  'percentual de encerradas, em forma tabular, sem georreferenciamento.', 'Quadro 11 (Ocorrências por Bairro)', 'F2-577')
S('Distribuição das investigações sanitárias por doença, espécie e bairro, com taxa de positividade',
  'Por ano civil: processos abertos, confirmados positivos e taxa de positividade, processos com contato humano e tempo médio até o '
  'resultado; distribuição por doença, resultados laboratoriais, espécie, bairro e laboratório.', 'Quadro 11 (Anual de Processos)', 'F2-577')

# ============================================================ Quadro 12 — RNFs
S('Responder em até 3 segundos. Interface responsiva em listas com 200+ registros.',
  'Meta: responder em até 3 segundos, com listas paginadas no servidor e cache dos indicadores do dashboard. Não houve medição formal de '
  'desempenho nesta entrega.', 'Quadro 12 (RNF01)', 'F2-069')
S('Exibir mensagem de erro na queda de rede e preservar dados de formulários não submetidos.',
  'Exibir mensagem de erro na queda de rede e preservar rascunhos locais, por usuário, dos formulários de animal, ocorrência, processo e '
  'registros clínicos (IndexedDB), até o envio bem-sucedido.', 'Quadro 12 (RNF03)', 'F2-581')
S('Disponível no horário do CCZ, com backup diário do banco.',
  'Disponível no horário do CCZ. O backup diário do banco é requisito de operação da implantação (procedimento recomendado: pg_dump '
  'diário), não funcionalidade do sistema.', 'Quadro 12 (RNF04)', 'F2-072')
S('Senhas com bcrypt. HTTPS. Dados sigilosos restritos por perfil. LGPD (Lei nº 13.709/2018).',
  'Senhas com bcrypt. Dados sigilosos mascarados no servidor e restritos por perfil, com acesso auditado. LGPD (Lei nº 13.709/2018). HTTPS '
  'é pré-requisito do ambiente de implantação (certificado e proxy da Prefeitura).', 'Quadro 12 (RNF06)', 'F2-074, F2-138')
S('Registrar usuário, data, hora e valores anterior/posterior em toda alteração crítica via AuditoriaEvento.',
  'Registrar usuário, data, hora, entidade e identificador do registro e valores anterior/posterior em toda alteração crítica via '
  'AuditoriaEvento, inclusive cadastro e edição de animais e baias e acesso a denunciante sigiloso. O endereço IP não é capturado.',
  'Quadro 12 (RNF10)', 'F2-078, F2-604')

# ============================================================ Quadro 13 — Regras de negócio
S('O protocolo (processo sanitário e ocorrência) é gerado automaticamente no formato 0000/AAAA',
  'O protocolo é gerado automaticamente pelo sistema no formato NNN/AAAA (três dígitos, crescendo além de 999 quando necessário), '
  'sequencial e reiniciado em 001 a cada ano civil, com uma sequência independente por entidade (ocorrência, processo sanitário e '
  'relatório gerado), mantida na tabela protocolo_sequencia com bloqueio de linha para evitar números repetidos em cadastros simultâneos.',
  'Quadro 13 (RN02)', 'F2-058, F2-595, F2-596')
S('Em ocorrências sigilosas, os dados do denunciante não são exibidos para nenhum perfil exceto Administrador',
  'Em ocorrências sigilosas, os dados do denunciante são mascarados no servidor e exibidos apenas aos perfis com a permissão '
  'denunciante_sigiloso (Administrador e Agente Sanitário); cada acesso a esses dados é registrado em auditoria. Ocorrência anônima não '
  'possui denunciante e não pode ser sigilosa.', 'Quadro 13 (RN03)', 'F2-059, F2-568')
S('Ocorrência com processo sanitário vinculado só pode ser encerrada depois de registrado o resultado desse processo.',
  'Ocorrência com processo sanitário vinculado só pode ser encerrada depois que esse processo estiver concluído.', 'Quadro 13 (RN05)', 'F2-061')
S('Histórico veterinário, processos e resultados não podem ser excluídos; a correção gera novo registro',
  'Histórico veterinário (vacinações, procedimentos, prescrições e exames), processos e resultados laboratoriais não podem ser alterados nem '
  'excluídos (gatilhos no banco impedem a exclusão); a correção gera novo registro que referencia o anterior (retifica_id), com registro em '
  'AuditoriaEvento. O resultado laboratorial Positivo é definitivo e não pode ser retificado.', 'Quadro 13 (RN06)', 'F2-574, F2-597, F2-610')
S('Obrigatórios: espécie, sexo, porte, baia, esterilizado, status, motivo de entrada e data de entrada.',
  'Obrigatórios no cadastro: nome, espécie, sexo, esterilizado, status, motivo de entrada e data de entrada; porte e baia são opcionais '
  '(animal em trânsito ou recém-chegado). Datas de fatos ocorridos não podem ser futuras. A ficha é considerada completa quando, além dos '
  'obrigatórios, possui microchip e vacinação vigente (indicador ficha_completa).', 'Quadro 13 (RN07)', 'F2-063, F2-563, F2-567')
S('Obrigatórios: data de abertura, doença, laboratório, ao menos uma amostra e os dados mínimos do responsável (nome, endereço).',
  'Obrigatórios: data de abertura (não futura), doença, laboratório, ao menos uma amostra e o nome do responsável; endereço e demais dados do '
  'responsável são opcionais.', 'Quadro 13 (RN08)', 'F2-064, F2-567')
S('Administrador: acesso total. Veterinário: Gestão de Animais (A) e Dashboard/Relatórios (D).',
  'Administrador: acesso total, inclusive usuários e trilha de auditoria. Veterinário: Gestão de Animais e baias (leitura e escrita), '
  'Processos Sanitários (leitura e escrita) e Dashboard/Relatórios. Agente Sanitário: Ocorrências (leitura e escrita), Processos Sanitários '
  '(leitura e escrita), Gestão de Animais (consulta) e Dashboard/Relatórios. Permissões fixas por cargo (CargoPermissao).',
  'Quadro 13 (RN09)', 'F2-065')
S('Ao registrar resultado Positivo ou Inconclusivo, o sistema envia e-mail ao responsável',
  'Ao registrar resultado Positivo ou Inconclusivo, o sistema envia e-mail ao responsável (quando houver e-mail cadastrado); o envio é '
  'registrado e não se repete automaticamente, mas pode ser reenviado manualmente. Pendência: o e-mail à Vigilância Epidemiológica do '
  'município não foi implementado nesta versão, por não haver endereço institucional definido; o envio fica registrado apenas em log do '
  'servidor.', 'Quadro 13 (RN10)', 'F2-014, F2-066, F2-573')
S('RelatorioGerado com estados Pendente→Em Processamento→Concluído/Falha.',
  'Exportação síncrona: o relatório é gerado na requisição e devolvido ao usuário; cada exportação é registrada em RelatorioGerado '
  '(histórico com identificador DOC-AAAA-NNNN, tipo, período, autor e tamanho). O binário não é armazenado no banco.',
  'Quadro 13 (RN11)', 'F2-067, F2-576')
S('Transições: ABERTO→EM_ANDAMENTO→AGUARDANDO_RESULTADO→CONCLUIDO.',
  'Transições: ABERTO→AGUARDANDO_RESULTADO→COM_RESULTADO→CONCLUIDO. O primeiro resultado só pode ser lançado com status '
  'AGUARDANDO_RESULTADO; a conclusão exige resultado registrado.', 'Quadro 13 (RN12)', 'F2-068, F2-177')

# ============================================================ Cap. 4 — datas e fuso; dicionário
S('Os campos de data e hora (timestamps) são armazenados em UTC',
  'Todos os modelos foram validados contra os requisitos funcionais (Capítulo 3), as regras de negócio (Seção 3.3) e os documentos de campo '
  'coletados na visita ao CCZ de Itu em 9 de janeiro de 2026. O banco de dados de destino é o PostgreSQL 16. As chaves primárias das '
  'tabelas são geradas via UUID v4 (Universally Unique Identifier, versão 4), identificadores de 128 bits gerados de forma aleatória, que '
  'garantem unicidade sem depender de um contador sequencial e reduzem o risco de colisão e de exposição de informações sobre o volume de '
  'registros, ao contrário de chaves numéricas incrementais. As datas de negócio são armazenadas como data civil (date) e os campos de data '
  'e hora (timestamps) sem fuso horário, já no horário oficial de Itu (America/Sao_Paulo), fuso fixo adotado pelo sistema; essa decisão '
  'evita o deslocamento de três horas na exibição e na comparação de datas com o dia corrente.',
  'Cap. 4 (introdução)', 'F2-158')
S('O banco de dados de destino é o PostgreSQL 16, com chaves primárias geradas via UUID v4 e timestamps armazenados em UTC.',
  'Os diagramas lógicos relacionais foram elaborados com a ferramenta dbdiagram.io a partir dos DERs conceituais e validados contra os '
  'requisitos funcionais (Capítulo 3) e as regras de negócio (Seção 3.3). A notação emprega retângulos para tabelas; colunas com tipo de '
  'dado e indicação de nulidade (NN = NOT NULL); chave primária (PK) identificada pelo ícone de chave; e chave estrangeira (FK) pelo ícone '
  'de elo. O banco de dados de destino é o PostgreSQL 16, com chaves primárias geradas via UUID v4 e datas e horas armazenadas no fuso '
  'America/Sao_Paulo, sem conversão. Os diagramas desta seção correspondem à modelagem; as diferenças entre essa modelagem e o esquema '
  'implementado (migrações Flyway) estão indicadas no dicionário de dados do Apêndice B.', 'Seção 4.3', 'F2-158, F2-596–F2-602')
S('As chaves primárias são do tipo UUID e as datas e horas são armazenadas em UTC.',
  'O dicionário de dados detalha cada tabela do modelo lógico, com o nome do campo, o tipo de dado, a indicação de chave (PK = chave '
  'primária, FK = chave estrangeira, UQ = valor único) e uma descrição concisa da finalidade do campo. As chaves primárias são do tipo UUID '
  'e as datas e horas são armazenadas no fuso America/Sao_Paulo. A ocupação das baias não é armazenada: é calculada pela contagem de '
  'animais alojados. O dicionário completo, organizado por módulo, encontra-se no Apêndice B; os parágrafos a seguir explicam duas decisões '
  'do Módulo 1.', 'Seção 4.4', 'F2-158')
S('Essa estrutura permite que um mesmo usuário possa, se necessário, estar vinculado a mais de um cargo',
  'Neste módulo, o cargo de cada funcionário, como administrador, veterinário ou agente sanitário, não é armazenado diretamente na tabela '
  'Usuario, mas modelado por meio das tabelas Cargo e UsuarioCargo. A tabela Cargo mantém os cargos existentes no CCZ, enquanto a tabela '
  'associativa UsuarioCargo relaciona cada usuário ao seu respectivo cargo. Na versão implementada, cada usuário recebe exatamente um cargo, '
  'e as permissões de acesso são concedidas por cargo, em matriz fixa definida na carga inicial, por meio da entidade CargoPermissao (RN09).',
  'Seção 4.4', 'F2-002, F2-025')
S('O acesso à trilha de auditoria é restrito ao perfil Administrador, que pode consultá-la aplicando filtros por usuário, entidade e período',
  'Ainda no módulo de Usuários e Acesso, a tabela AuditoriaEvento implementa a trilha de auditoria do sistema, mecanismo que atende às regras '
  'de negócio de imutabilidade dos registros críticos (RN06) e ao requisito não funcional de rastreabilidade (RNF10). Sempre que um registro '
  'sensível, como um histórico veterinário ou um processo sanitário, é criado ou alterado, o sistema grava automaticamente um evento de '
  'auditoria contendo o usuário responsável, a ação realizada, a data e a hora do evento, a entidade e o identificador do registro afetado, '
  'preservando os valores anterior e posterior à alteração. Dessa forma, os registros críticos não são sobrescritos nem apagados: qualquer '
  'modificação gera um novo evento, o que garante o histórico completo das operações. O acesso à trilha de auditoria é restrito ao perfil '
  'Administrador, que a consulta na tela de Logs aplicando filtros por ação, entidade, módulo, usuário e período (RF-C04), em conformidade '
  'com os princípios de responsabilização e prestação de contas previstos pela LGPD.', 'Seção 4.4', 'F2-027, F2-604')

# ============================================================ Quadro 14 — bibliotecas
S('Rascunho local de formulários no IndexedDB', 'Rascunho local de formulários no IndexedDB (API nativa do navegador, sem biblioteca)', 'Quadro 14 (idb)', 'F2-149')
R('idb', 'IndexedDB', 'Quadro 14 (idb)', 'F2-149')
S('Testes ponta a ponta no navegador', 'Previsto para testes ponta a ponta; não incorporado nesta entrega (trabalho futuro)', 'Quadro 14 (Playwright)', 'F2-154')
L('Redução de código repetitivo nas classes', ['MapStruct', 'Backend', 'Mapeamento entre entidades e DTOs', 'RNF08'], 'Quadro 14 (nova linha)', 'F2-588')
L('Mapeamento entre entidades e DTOs', ['Caffeine', 'Backend', 'Cache de 5 minutos dos indicadores e gráficos do dashboard', 'RF-D01, RNF01'], 'Quadro 14 (nova linha)', 'F2-589')
L('Validação dos formulários no navegador', ['react-hook-form e @hookform/resolvers', 'Frontend', 'Estado dos formulários e integração da validação Zod', 'RN07, RN08'], 'Quadro 14 (nova linha)', 'F2-587')
L('Estado dos formulários e integração da validação Zod', ['ViaCEP (serviço externo)', 'Frontend', 'Preenchimento do endereço a partir do CEP, com preenchimento manual quando indisponível', 'RF-E01'], 'Quadro 14 (nova linha)', 'F2-155')

# ============================================================ Seção 5.1
S('O backend está organizado em pacotes por módulo – usuarios, animais, ocorrencias, processos, relatorios e comum –',
  'O backend está organizado em pacotes por módulo – usuarios, animais, alertas, ocorrencias, processos, relatorios, auditoria e comum –, cada um '
  'com controladores, serviços, repositórios e entidades; o frontend está organizado em pastas por funcionalidade. Na inicialização, uma '
  'carga de dados (DataSeeder) cria o usuário administrador e os catálogos (espécies, status, cargos, doenças, laboratórios, vacinas), e o '
  'frontend é servido por nginx em contêiner; o endpoint público de saúde da API apoia o monitoramento. Além dos frameworks descritos na '
  'Seção 2.3, o SISZOO utiliza as bibliotecas do Quadro 14, escolhidas por implementarem diretamente os requisitos e as regras de negócio '
  'indicados na última coluna.', 'Seção 5.1', 'F2-562, F2-579, F2-591, F2-592')

# ============================================================ Quadro 15 — telas
S('Veterinário, Administrador', 'Veterinário, Administrador; Agente Sanitário (consulta)', 'Quadro 15 (T04)', 'F2-105', oc=1, exato=True)
S('Administrador (edição); Veterinário (consulta)', 'Administrador e Veterinário (edição); exclusão só Administrador', 'Quadro 15 (T07)', 'F2-108')
S('RF-E02, RN03', 'RF-E02, RN03 (denunciante sigiloso visível a Administrador e Agente Sanitário, com auditoria)', 'Quadro 15 (T08)', 'F2-059')
S('Agente Sanitário, Administrador', 'Agente Sanitário, Veterinário, Administrador', 'Quadro 15 (T11)', 'F2-112', oc=4, exato=True)
S('Agente Sanitário, Administrador', 'Agente Sanitário, Veterinário, Administrador', 'Quadro 15 (T12)', 'F2-113', oc=4, exato=True)
S('Agente Sanitário, Administrador', 'Agente Sanitário, Veterinário, Administrador', 'Quadro 15 (T13)', 'F2-114', oc=4, exato=True)
S('Perfil e Ajuda', 'Perfil', 'Quadro 15 (T17)', 'F2-118', oc=1, exato=True)
L('Perfil', ['T24', 'Troca de senha (primeiro acesso)', 'Todos', 'RF-C01', '—'], 'Quadro 15 (nova linha)', 'F2-583', oc=1, exato=True)
L('Troca de senha (primeiro acesso)', ['T25', 'Medicamentos (catálogo)', 'Veterinário, Administrador', 'RF-A04', 'Lista manual de medicamentos'], 'Quadro 15 (nova linha)', 'F2-584')
L('Medicamentos (catálogo)', ['T26', 'Logs (trilha de auditoria)', 'Administrador', 'RF-C04, RNF10', '—'], 'Quadro 15 (nova linha)', 'F2-027')
N('Quadro 15 – Telas do SISZOO',
  'As telas T18 a T23, apresentadas no Apêndice E, são visualizações geradas dentro da própria central de relatórios (T14), e não telas '
  'independentes. As telas T24 a T26 e as variantes de edição de animal e de ocorrência (abertas a partir de T06 e T10) não têm captura '
  'neste documento.', 'F2-119, F2-583, F2-584, F2-585')

# ============================================================ Seção 5.2 — textos das telas
S('A Figura 31 apresenta a tela T01, de login, comum a todos os perfis.',
  'A Figura 31 apresenta a tela T01, de login, comum a todos os perfis. O acesso é feito com e-mail institucional e senha, e o sistema exige '
  'a troca de senha no primeiro acesso, em tela própria (RF-C01). A tela corresponde ao caso de uso Realizar Login.', 'Seção 5.2 (T01)', 'F2-583')
S('A Figura 32 apresenta a tela T02, o dashboard operacional, primeira tela após o login.',
  'A Figura 32 apresenta a tela T02, o dashboard operacional, primeira tela após o login. Ela reúne os indicadores do CCZ (animais por '
  'espécie, percentual de vacinados e ocorrências do dia), os alertas críticos (reforço vacinal, vacinas vencidas, animais sem avaliação, '
  'baias superlotadas e fichas incompletas) e gráficos de evolução, com atualização em cache de 5 minutos (RF-D01, RF-A03); o cartão '
  '“Adoções no mês” é indicador ilustrativo, por não haver registro da data de adoção. Corresponde ao caso de uso Visualizar Dashboard em '
  'Tempo Real e substitui as contagens e os gráficos montados manualmente pela direção.', 'Seção 5.2 (T02)', 'F2-019, F2-566, F2-578')
S('A Figura 34 apresenta a tela T04, de listagem dos animais do canil, com filtros por baia, espécie e status (RF-A02).',
  'A Figura 34 apresenta a tela T04, de listagem dos animais do canil, com busca por nome ou microchip e filtros por espécie, status e baia '
  '(RF-A02); o Agente Sanitário a acessa em modo de consulta (RN09). Corresponde ao caso de uso Consultar Animais por Baia e substitui a '
  'planilha de controle por baias.', 'Seção 5.2 (T04)', 'F2-105')
S('A Figura 35 apresenta a tela T05, de cadastro de animal.',
  'A Figura 35 apresenta a tela T05, de cadastro de animal, em três etapas (dados básicos, saúde e baia, foto e revisão). O sistema verifica '
  'se o número do microchip ou da medalha já está cadastrado (RN01), registra a data de implantação do chip e a procedência e exige os '
  'campos obrigatórios da RN07; o animal que chega sem microchip pode ser cadastrado e recebe o número quando o chip for implantado. O '
  'formulário mantém rascunho local para não perder dados em queda de rede (RNF03). A tela corresponde ao caso de uso Cadastrar Animal e '
  'substitui a ficha manuscrita e o cadastro paralelo na plataforma AnimalTag.', 'Seção 5.2 (T05)', 'F2-004, F2-581')
S('A Figura 36 apresenta a tela T06, ficha do animal, com identificação, histórico veterinário, alertas de vacina e registro de saída e adoção',
  'A Figura 36 apresenta a tela T06, ficha do animal, com identificação (microchip, medalha, data de implantação e procedência), abas do '
  'histórico veterinário (vacinações, procedimentos, prescrições e exames), anexos do animal e a situação atual, cuja mudança de status '
  'registra a saída; no óbito por eutanásia o laudo do responsável técnico é obrigatório (RF-A01, RF-A03, RF-A04, RF-A05). Os registros '
  'clínicos não podem ser editados nem excluídos: a correção gera novo registro (RN06). O registro de adoção com dados do adotante está '
  + TF + '.', 'Seção 5.2 (T06)', 'F2-007, F2-008')
S('A Figura 37 apresenta a tela T07, de gestão de baias, com a ocupação calculada de cada baia',
  'A Figura 37 apresenta a tela T07, de gestão de baias, com a ocupação calculada de cada baia, a capacidade e a indicação de superlotação '
  '(RF-A02). Administrador e Veterinário criam e editam baias; a exclusão lógica é do Administrador. Corresponde aos casos de uso Gerenciar '
  'Baias e Monitorar Ocupação de Baias.', 'Seção 5.2 (T07)', 'F2-005, F2-108')
S('A Figura 38 apresenta a tela T08, de listagem de ocorrências, com filtros por tipo e status.',
  'A Figura 38 apresenta a tela T08, de listagem de ocorrências, com busca livre, filtros por tipo, status e período da data de abertura e '
  'gráfico de distribuição por bairro. Em ocorrências sigilosas, os dados do denunciante são mascarados no servidor para quem não tem a '
  'permissão correspondente, e o acesso de Administrador e Agente Sanitário a esses dados é auditado (RN03). Substitui o caderno físico de '
  'ocorrências.', 'Seção 5.2 (T08)', 'F2-010, F2-059')
S('A Figura 39 apresenta a tela T09, de registro de ocorrência, com protocolo gerado automaticamente no formato 0000/AAAA (RN02)',
  'A Figura 39 apresenta a tela T09, de registro de ocorrência, com protocolo gerado automaticamente no formato NNN/AAAA (RN02), marcação de '
  'sigilo ou de denúncia anônima, denunciado opcional, anexos e preenchimento do endereço do denunciante a partir do CEP (RF-E01). '
  'Corresponde ao caso de uso Registrar Nova Ocorrência.', 'Seção 5.2 (T09)', 'F2-058, F2-155, F2-568')
S('A Figura 40 apresenta a tela T10, de detalhe da ocorrência, com movimentações e encerramento.',
  'A Figura 40 apresenta a tela T10, de detalhe da ocorrência, com movimentações, processo sanitário vinculado e encerramento. O '
  'encerramento fica bloqueado enquanto o processo sanitário vinculado não estiver concluído (RN05). O bloco de localização é um marcador '
  'visual: não há mapa georreferenciado (Seção 3.4).', 'Seção 5.2 (T10)', 'F2-061, F2-082')
S('A Figura 42 apresenta a tela T12, de abertura de processo sanitário, organizada em etapas',
  'A Figura 42 apresenta a tela T12, de abertura de processo sanitário, organizada em etapas: vínculo com a ocorrência e dados do processo '
  '(doença, laboratório e números do GAL e do SINAN, opcionais), responsável, amostras e revisão (RF-B01, RF-B04). Corresponde aos casos de '
  'uso Abrir Processo Sanitário e Registrar Animal Amostrado.', 'Seção 5.2 (T12)', 'F2-012')
S('A Figura 43 apresenta a tela T13, de detalhe do processo, onde o agente registra o resultado laboratorial e o desfecho.',
  'A Figura 43 apresenta a tela T13, de detalhe do processo, onde o usuário registra o resultado laboratorial e o desfecho, em histórico '
  'imutável. Resultado Positivo ou Inconclusivo gera notificação por e-mail ao responsável, com reenvio manual (RN10); a notificação à '
  'Vigilância Epidemiológica permanece como pendência.', 'Seção 5.2 (T13)', 'F2-014')
S('A Figura 44 apresenta a tela T14, central de relatórios, onde o usuário escolhe o tipo e o período, solicita a geração e acompanha o status',
  'A Figura 44 apresenta a tela T14, central de relatórios, onde o usuário escolhe o tipo e o período, gera o relatório em tela e o exporta em '
  'PDF ou CSV; a lista de relatórios recentes mostra o histórico de exportações (RF-D02, RN11).', 'Seção 5.2 (T14)', 'F2-020')
S('A Figura 45 apresenta a tela T15, de gestão de usuários, em que o Administrador cadastra, desativa e reativa usuários e atribui cargos',
  'A Figura 45 apresenta a tela T15, de gestão de usuários, em que o Administrador cadastra, desativa e reativa usuários e define o cargo de '
  'cada um no cadastro (RF-C02).', 'Seção 5.2 (T15)', 'F2-002')
S('A Figura 47 apresenta a tela T17, de perfil do usuário e ajuda, com os dados da conta e orientações de uso do sistema.',
  'A Figura 47 apresenta a tela T17, de perfil do usuário, com os dados da conta, as permissões do cargo e a atualização do telefone; a troca '
  'de senha é feita em tela própria. A tela de ajuda prevista não foi implementada.', 'Seção 5.2 (T17)', 'F2-118, F2-559')
S('Este apêndice apresenta as telas dos relatórios específicos do SISZOO, descritos no Quadro 11.',
  'Este apêndice apresenta as telas dos relatórios específicos do SISZOO, descritos no Quadro 11. Elas são visualizações geradas na central '
  'de relatórios (T14), capturadas após o acionamento de “Gerar Relatório”.', 'Apêndice E', 'F2-119')

# ============================================================ Considerações Finais
TXT_TESTES = (f"Na entrega, o backend conta com {TESTES['backend_unitarios']} testes unitários e {TESTES['backend_integracao']} testes de "
              f"integração (JUnit 5, Testcontainers e Rest Assured), e o frontend com {TESTES['frontend']} testes de componentes (Vitest, "
              f"Testing Library e MSW), todos aprovados; os testes ponta a ponta não foram realizados.")
S('[DESCREVER O QUE FOI IMPLEMENTADO E O QUE FICOU PENDENTE NA ENTREGA.]',
  'Os objetivos de mapear o fluxo de trabalho vigente, levantar os requisitos e modelar o sistema foram atingidos: foram especificados 21 '
  'requisitos funcionais, 10 requisitos não funcionais e 12 regras de negócio, detalhados em diagramas de casos de uso, com 36 especificações '
  'de baixo nível, diagramas entidade-relacionamento, lógicos e de classes, dicionário de dados e protótipos das interfaces. Dos requisitos '
  'funcionais, foram implementados os cinco módulos com autenticação e trilha de auditoria, cadastro e ficha dos animais com histórico '
  'clínico imutável (vacinações, procedimentos, prescrições, exames e anexos), gestão de baias, alertas vacinais, ocorrências com sigilo do '
  'denunciante, processos sanitários com protocolo anual, amostras, resultado laboratorial e notificação por e-mail, dashboard e seis '
  'relatórios em PDF e CSV. Ficaram pendentes o registro de adoção com dados do adotante (RF-A05, parcial), o documento PDF do processo '
  '(RF-B06) e o e-mail automático à Vigilância Epidemiológica (RN10), mantidos na modelagem como trabalhos futuros. ' + TXT_TESTES,
  'Considerações Finais', 'F2-007, F2-008, F2-014, F2-017, F2-027, F2-154')
S('[ACRESCENTAR REQUISITOS NÃO IMPLEMENTADOS, SE HOUVER.]',
  'Entre as limitações, destacam-se a restrição do escopo ao CCZ de Itu e a ausência de integração com os sistemas de vigilância SINAN e GAL, '
  'cujos números são apenas registrados. Também não foram implementados o registro da data de saída do animal e dos dados do adotante, o '
  'documento PDF do processo, o e-mail automático à Vigilância Epidemiológica, os anexos por registro clínico e os testes ponta a ponta no '
  'navegador; HTTPS e backup diário dependem do ambiente de implantação.', 'Considerações Finais (limitações)', 'F2-008, F2-017, F2-014, F2-154, F2-072, F2-074')
S('Como trabalhos futuros, propõem-se a capacitação da equipe e a implantação do sistema',
  'Como trabalhos futuros, propõem-se a capacitação da equipe e a implantação do sistema, acompanhadas de avaliação de uso com os '
  'funcionários; a conclusão dos itens modelados e não implementados — registro de adoção e devolução (entidade Adocao), documento PDF do '
  'processo (DocumentoProcesso) e e-mail automático à Vigilância Epidemiológica —; a adoção de testes ponta a ponta no navegador; a '
  'integração com o SINAN, o GAL e a plataforma AnimalTag; a integração com o Cadastro Nacional de Animais Domésticos, autorizado pela Lei nº '
  '15.046/2024; o desenvolvimento de aplicativo móvel para os agentes em campo; e um módulo público de adoção.',
  'Considerações Finais (trabalhos futuros)', 'F2-008, F2-017, F2-014, F2-154')

# ============================================================ Apêndice A — casos de uso
S('Registra o evento de auditoria de LOGOUT e redireciona à tela de login.',
  'Redireciona à tela de login. O logout é uma ação do cliente, sem chamada ao servidor; não gera evento de auditoria.', 'Quadro 17', 'F2-001, F2-022')
S('O usuário encerra o uso do sistema, descartando o token JWT em uso.',
  'O usuário encerra o uso do sistema; o navegador descarta o token JWT em uso (autenticação sem estado).', 'Quadro 17', 'F2-022')
S('O Administrador cadastra, edita e atribui cargos e permissões aos usuários do sistema.',
  'O Administrador cadastra usuários e define o cargo de cada um; a edição dos dados cadastrais de outros usuários não foi implementada.', 'Quadro 19', 'F2-002, F2-024')
S('O Administrador atribui um ou mais cargos ao usuário (Atribuir Cargo e Permissões).',
  'O Administrador seleciona o cargo do usuário (Atribuir Cargo e Permissões).', 'Quadro 19', 'F2-025')
S('O Administrador vincula ao usuário um ou mais cargos; as permissões de acesso decorrem dos cargos atribuídos.',
  'O Administrador define, no cadastro, o único cargo do usuário; as permissões de acesso decorrem do cargo, em matriz fixa (CargoPermissao).', 'Quadro 20', 'F2-025')
S('Exibe os cargos disponíveis (Administrador, Veterinário e Agente Sanitário) e as permissões de cada um por módulo.',
  'Exibe os cargos disponíveis (Administrador, Veterinário e Agente Sanitário).', 'Quadro 20', 'F2-025')
S('O Administrador seleciona o cargo ou os cargos do usuário.', 'O Administrador seleciona o cargo do usuário.', 'Quadro 20', 'F2-025')
S('Todo usuário tem ao menos um cargo. As permissões por módulo (leitura, escrita e exclusão) são definidas no cargo (CargoPermissao), não no usuário.',
  'Todo usuário tem exatamente um cargo, definido no cadastro. As permissões por módulo (leitura, escrita e exclusão) são fixas por cargo (CargoPermissao), não configuráveis pela interface.', 'Quadro 20', 'F2-025')
S('O Administrador aciona “Desativar” (ou “Reativar”) e confirma.',
  'O Administrador aciona “Desativar” (ou “Reativar”) e confirma; o sistema recusa a desativação da própria conta.', 'Quadro 21', 'F2-560')
S('O Administrador acessa a trilha de auditoria e define filtros (usuário, entidade, período).',
  'O Administrador acessa a tela de Logs e define filtros (ação, entidade, módulo, usuário, período).', 'Quadro 22', 'F2-027')
S('Exibe a lista com usuário, ação, entidade, data/hora e os valores anterior e posterior.',
  'Exibe a lista paginada com usuário, ação, entidade, identificador do registro, data/hora e os valores anterior e posterior.', 'Quadro 22', 'F2-027')
S('RF-C02, RN06, RNF10', 'RF-C04, RN06, RNF10', 'Quadro 22', 'F2-027', oc=1)
S('O Veterinário informa o número do microchip (quando o animal já o possuir), espécie, sexo, porte, baia e demais dados',
  'O Veterinário informa nome, espécie, sexo, status, motivo e data de entrada e, quando houver, microchip e data de implantação, número da '
  'medalha, procedência, porte, baia e demais dados (raça, pelagem, coloração, peso, foto).', 'Quadro 23', 'F2-004, F2-028, F2-063')
S('Microchip único quando informado (RN01). Campos obrigatórios: espécie, sexo, porte, baia, esterilizado, status, motivo e data de entrada (RN07).',
  'Microchip e medalha únicos quando informados (RN01). Campos obrigatórios: nome, espécie, sexo, esterilizado, status, motivo e data de entrada; porte e baia opcionais (RN07).', 'Quadro 23', 'F2-028, F2-063')
S('Valida os dados, mantendo a unicidade do microchip, e persiste as alterações.',
  'Valida os dados; o microchip, uma vez definido, não pode ser alterado nem removido, e a medalha deve permanecer única. Persiste as alterações.', 'Quadro 24', 'F2-029')
S('A alteração do microchip não pode gerar duplicidade (RN01). Histórico preservado por auditoria (RN06).',
  'Microchip imutável depois de definido (RN01). Alteração registrada em auditoria com valores anterior e posterior (RN06, RNF10).', 'Quadro 24', 'F2-029')
S('O Veterinário registra a saída do animal do canil, informando o destino.',
  'O Veterinário registra a saída do animal do canil, alterando o status para o destino.', 'Quadro 25', 'F2-030')
S('O Veterinário informa o destino (Adotado, Resgatado, Óbito, Eutanásia ou Transferido) e a data.',
  'O Veterinário informa o destino (Adotado, Óbito natural, Óbito eutanásia ou Transferido); no óbito por eutanásia, informa o laudo do responsável técnico.', 'Quadro 25', 'F2-030, F2-167')
S('Valores de saída restritos a Adotado, Resgatado, Óbito, Eutanásia e Transferido. Histórico imutável (RN06).',
  'Valores de saída restritos a Adotado, Óbito natural, Óbito eutanásia e Transferido. Laudo obrigatório na transição para Óbito eutanásia. Não há data de saída específica (limitação). Histórico imutável (RN06).', 'Quadro 25', 'F2-030')
S('Destino Adotado: o sistema solicita os dados do adotante (caso de uso Registrar Adoção).',
  'Destino Adotado: o registro dos dados do adotante (caso de uso Registrar Adoção) está ' + TF + '.', 'Quadro 25', 'F2-031')
S('O Veterinário registra os dados do adotante e da adoção do animal.',
  'O Veterinário registra os dados do adotante e da adoção do animal. Caso de uso ' + TF + '.', 'Quadro 26', 'F2-031')
S('O Veterinário move um animal de uma baia para outra.',
  'O Veterinário move um animal de uma baia para outra, pela edição do cadastro do animal (não há histórico de transferências).', 'Quadro 27', 'F2-032')
S('O Veterinário solicita e registra o resultado de um exame laboratorial do animal.',
  'O Veterinário registra a solicitação de um exame do animal e, quando disponível, o resultado.', 'Quadro 32', 'F2-037')
S('O Veterinário informa o tipo de exame, o laboratório e a data de solicitação.',
  'O Veterinário informa o tipo de exame (catálogo), o laboratório (opcional), a data de solicitação e, se já houver, o resultado e a data do resultado.', 'Quadro 32', 'F2-037')
S('Posteriormente, o Veterinário registra o resultado e a data de resultado.',
  'Posteriormente, para incluir ou corrigir o resultado, o Veterinário registra um novo exame que retifica o anterior.', 'Quadro 32', 'F2-037')
S('Atualiza o exame com o resultado informado.', 'Grava o novo registro vinculado ao anterior (retifica_id); o registro original permanece.', 'Quadro 32', 'F2-037')
S('Anexar laudo: o Veterinário pode anexar o laudo ao exame registrado.',
  'Anexar laudo: o Veterinário pode anexar o laudo como anexo do animal (caso de uso Anexar Documento ao Animal).', 'Quadro 32', 'F2-039')
S('O Administrador cadastra e edita as baias do canil, com tipo, capacidade e finalidade.',
  'Administrador e Veterinário cadastram e editam as baias do canil, com tipo, capacidade e finalidade; só o Administrador desativa ou exclui logicamente uma baia.', 'Quadro 33', 'F2-038, F2-565')
S('O Veterinário anexa um arquivo (laudo, receita, imagem) ao registro clínico do animal.',
  'O Veterinário anexa um arquivo (laudo, receita, imagem; JPG, PNG ou PDF, até 5 MB, máximo de 10 por animal) à ficha do animal.', 'Quadro 34', 'F2-039')
S('O Veterinário está registrando uma vacinação, um procedimento ou um exame.',
  'O animal está cadastrado; o anexo é vinculado ao animal, e não a um registro clínico específico.', 'Quadro 34', 'F2-039')
S('Arquivo armazenado e vinculado ao registro, com nome, endereço e tamanho.',
  'Arquivo armazenado no banco (conteúdo binário em tabela própria) e vinculado ao animal, com nome, tipo, tamanho e descrição; upload registrado em auditoria.', 'Quadro 34', 'F2-039')
S('Armazena o arquivo e o vincula ao registro clínico em andamento.', 'Armazena o arquivo e o vincula ao animal.', 'Quadro 34', 'F2-039')
S('Gera o protocolo no formato 0000/AAAA e preenche a data de abertura com a data corrente (RN02).',
  'Gera o protocolo no formato NNN/AAAA e preenche a data de abertura com a data corrente (RN02).', 'Quadro 35', 'F2-058')
S('O Agente Sanitário informa o tipo, o bairro, a descrição e, se necessário, marca a ocorrência como sigilosa.',
  'O Agente Sanitário informa o tipo, o endereço, o bairro, a descrição e, se necessário, marca a ocorrência como urgente, sigilosa ou anônima (sem denunciante).', 'Quadro 35', 'F2-568')
S('Valida os dados, persiste a ocorrência com o denunciante e cria a movimentação inicial de ABERTURA.',
  'Valida os dados, persiste a ocorrência com o denunciante e cria a movimentação inicial REGISTRADA (status ABERTA).', 'Quadro 35', 'F2-176, F2-569')
S('Protocolo sequencial e anual 0000/AAAA (RN02). Em ocorrências sigilosas, o denunciante fica oculto para não-Administradores (RN03).',
  'Protocolo sequencial e anual NNN/AAAA (RN02). Em ocorrências sigilosas, o denunciante fica oculto para perfis sem a permissão denunciante_sigiloso (RN03); anônima e sigilosa são excludentes.', 'Quadro 35', 'F2-058, F2-059')
S('O Agente Sanitário acessa a consulta de ocorrências e define filtros (protocolo, período, tipo, bairro, status).',
  'O Agente Sanitário acessa a consulta de ocorrências e define filtros (tipo, status, período da data de abertura e busca livre por protocolo, bairro ou denunciante).', 'Quadro 38', 'F2-010, F2-043')
S('Exibe a listagem; em ocorrências sigilosas, oculta os dados do denunciante para perfis que não sejam Administrador (RN03).',
  'Exibe a listagem; em ocorrências sigilosas, o servidor mascara os dados do denunciante para perfis sem a permissão denunciante_sigiloso (RN03).', 'Quadro 38', 'F2-059')
S('Os dados do denunciante em ocorrências sigilosas só são exibidos ao Administrador (RN03).',
  'Os dados do denunciante em ocorrências sigilosas só são exibidos a Administrador e Agente Sanitário, e o acesso é registrado em auditoria (RN03).', 'Quadro 38', 'F2-059')
S('Acesso como Administrador: os dados do denunciante são exibidos mesmo em ocorrências sigilosas.',
  'Acesso como Administrador ou Agente Sanitário: os dados do denunciante são exibidos mesmo em ocorrências sigilosas, com evento de auditoria.', 'Quadro 38', 'F2-059')
S('Atualiza o status para encerrada, registra a data de encerramento e a movimentação de ENCERRAMENTO.',
  'Atualiza o status para ENCERRADA, registra a data e o autor do encerramento e a movimentação ENCERRADA.', 'Quadro 39', 'F2-176')
S('Ocorrência com processo sanitário vinculado só pode ser encerrada após o registro do resultado desse processo (RN05).',
  'Ocorrência com processo sanitário vinculado só pode ser encerrada depois que esse processo estiver concluído (RN05).', 'Quadro 39', 'F2-044')
S('Processo vinculado sem resultado: o sistema impede o encerramento e informa o protocolo do processo pendente (RN05).',
  'Processo vinculado não concluído: o sistema impede o encerramento e informa o protocolo do processo pendente (RN05).', 'Quadro 39', 'F2-044')
S('Gera o protocolo no formato 0000/AAAA e preenche a data de abertura (RN02).',
  'Gera o protocolo no formato NNN/AAAA e preenche a data de abertura (RN02).', 'Quadro 40', 'F2-058')
S('Protocolo sequencial e anual (RN02). Obrigatórios: data de abertura, doença, laboratório e dados mínimos do responsável (RN08).',
  'Protocolo sequencial e anual (RN02). Obrigatórios: data de abertura, doença, laboratório, ao menos uma amostra e nome do responsável (RN08). O vínculo com a ocorrência também pode ser feito depois, a partir da ocorrência.', 'Quadro 40', 'F2-045, F2-064, F2-570')
S('O processo deve estar em andamento ou aguardando resultado (não pode estar com status ABERTO).',
  'O processo deve estar aguardando resultado (não pode estar com status ABERTO nem CONCLUIDO).', 'Quadro 42', 'F2-047, F2-068')
S('Resultado e desfecho registrados; em caso positivo ou inconclusivo, o responsável e a Vigilância Epidemiológica são notificados por e-mail.',
  'Resultado e desfecho registrados em histórico imutável; em caso Positivo ou Inconclusivo, o responsável é notificado por e-mail.', 'Quadro 42', 'F2-047')
S('Valida que o status permite o resultado (RN12) e persiste o resultado e o desfecho.',
  'Valida que o status permite o resultado (RN12) e persiste o resultado e o desfecho como novo registro (ResultadoProcesso); correções geram novo registro, e o resultado Positivo é definitivo.', 'Quadro 42', 'F2-047, F2-574')
S('Caso o resultado seja Positivo ou Inconclusivo, envia e-mail ao responsável, quando houver e-mail cadastrado, e à Vigilância Epidemiológica, e registra o envio (RN10).',
  'Caso o resultado seja Positivo ou Inconclusivo, envia e-mail ao responsável, quando houver e-mail cadastrado, e registra o envio (RN10). O e-mail à Vigilância Epidemiológica é pendência: não implementado.', 'Quadro 42', 'F2-047')
S('Sem e-mail do responsável: o sistema registra o resultado, e notifica apenas a Vigilância Epidemiológica.',
  'Sem e-mail do responsável: o sistema registra o resultado e não envia notificação; o reenvio manual fica disponível quando o e-mail for cadastrado.', 'Quadro 42', 'F2-047, F2-573')
S('O Agente Sanitário acessa a consulta e define filtros (protocolo, período, doença, responsável, bairro, status).',
  'O Agente Sanitário acessa a consulta e define filtros (doença, status).', 'Quadro 43', 'F2-048')
S('O processo deve possuir resultado registrado quando houver contato humano (RF-B05).',
  'O processo deve estar com resultado registrado (status COM_RESULTADO), conforme RN12.', 'Quadro 44', 'F2-049')
S('Verifica se o processo possui resultado quando o contato humano for verdadeiro (RF-B05).',
  'Verifica se o processo possui resultado registrado (RN12, RF-B05).', 'Quadro 44', 'F2-049')
S('Processos com contato humano não podem ser encerrados sem resultado (RF-B05). Registro imutável (RN06).',
  'Nenhum processo pode ser concluído sem resultado (RN12, RF-B05). Registro imutável (RN06).', 'Quadro 44', 'F2-049')
S('O Agente Sanitário gera o documento em PDF de um processo sanitário.',
  'O Agente Sanitário gera o documento em PDF de um processo sanitário. Caso de uso ' + TF + '.', 'Quadro 45', 'F2-050')
for _q in (46, 49, 50, 51):
    S('Veterinário ou Agente Sanitário', 'Veterinário, Agente Sanitário ou Administrador', f'Quadro {_q}', 'F2-051, F2-065', oc=1, exato=True)
S('Consulta em tempo real os totais por status de animal, a ocupação das baias e os alertas vacinais de 7 dias.',
  'Consulta, com cache de 5 minutos, os totais de animais por espécie, o percentual de vacinados, as ocorrências do dia e os alertas (vacinais de 7 dias, vencidas, sem avaliação há 30 dias, baias superlotadas e fichas incompletas).', 'Quadro 46', 'F2-051, F2-566')
S('Consulta os processos aguardando resultado, os processos urgentes e o resumo mensal por doença.',
  'Consulta os gráficos de evolução (ocorrências, vacinações e ocupação) e a lista de processos urgentes.', 'Quadro 46', 'F2-051')
S('O dashboard é alimentado por consultas em tempo real e não gera entidade persistida.',
  'O dashboard é alimentado por consultas agregadas com cache de 5 minutos e não gera entidade persistida.', 'Quadro 46', 'F2-578')
S('O usuário solicita a geração de um relatório, processado de forma assíncrona.',
  'O usuário gera um relatório na central de relatórios, de forma síncrona, e o exporta em PDF ou CSV.', 'Quadro 49', 'F2-054')
S('Solicitação registrada com status Pendente e processada em segundo plano.',
  'Relatório exibido em tela; a exportação é registrada no histórico (RelatorioGerado).', 'Quadro 49', 'F2-054')
S('Cria o registro do relatório com status Pendente e inicia o processamento assíncrono (RN11).',
  'Consulta os dados do período e exibe o relatório em tela (pré-visualização).', 'Quadro 49', 'F2-054')
S('Ao concluir, atualiza o status para Concluído e disponibiliza o arquivo por URL com expiração.',
  'Ao exportar, gera o arquivo PDF ou CSV, devolve-o ao navegador e registra a exportação com identificador DOC-AAAA-NNNN (RN11).', 'Quadro 49', 'F2-054, F2-576')
S('A geração segue os estados Pendente → Em Processamento → Concluído/Falha (RN11). O binário não é armazenado no banco.',
  'Geração síncrona (RN11). O binário não é armazenado no banco. Filtros por tipo: ano (anual de processos), janela de 6 ou 12 meses ou período (ocupação de baias) e período (demais).', 'Quadro 49', 'F2-054, F2-577', oc=1)
S('Falha no processamento: o sistema marca o relatório como Falha e permite nova solicitação.',
  'Período inválido (início posterior ao fim): o sistema informa o erro e não gera o relatório.', 'Quadro 49', 'F2-054')
S('O usuário acompanha o andamento da geração de um relatório solicitado.',
  'O usuário consulta o histórico de exportações realizadas (relatórios recentes).', 'Quadro 50', 'F2-055')
S('Deve existir ao menos um relatório solicitado pelo usuário.', 'Deve existir ao menos uma exportação registrada.', 'Quadro 50', 'F2-055')
S('Status atual do relatório exibido ao usuário.', 'Histórico exibido, com tipo, período, autor, data e tamanho de cada exportação.', 'Quadro 50', 'F2-055')
S('O usuário acessa a lista de relatórios solicitados.', 'O usuário acessa a lista de relatórios recentes na central de relatórios.', 'Quadro 50', 'F2-055')
S('Exibe cada relatório com seu status atual (Pendente, Em Processamento, Concluído ou Falha).',
  'Exibe cada exportação com identificador, tipo, período, autor, data, tamanho e situação (concluído).', 'Quadro 50', 'F2-055')
S('O status reflete o ciclo de vida assíncrono do relatório (RN11).', 'O histórico é paginado e não armazena o arquivo (RN11).', 'Quadro 50', 'F2-055')
S('Relatório concluído: o sistema habilita a opção de download (Baixar Relatório Gerado).',
  'Gerar novamente: o sistema repete a geração com os mesmos parâmetros (Baixar Relatório Gerado).', 'Quadro 50', 'F2-055')
S('O usuário baixa o arquivo de um relatório concluído.', 'O usuário baixa o arquivo PDF ou CSV do relatório exibido em tela.', 'Quadro 51', 'F2-056')
S('O relatório deve estar com status Concluído e a URL não expirada.', 'O relatório deve ter sido gerado em tela.', 'Quadro 51', 'F2-056')
S('O usuário seleciona um relatório concluído e aciona o download.', 'O usuário aciona “Baixar PDF” ou “Baixar CSV” no relatório exibido.', 'Quadro 51', 'F2-056')
S('Verifica se o relatório está concluído e se a URL não expirou.', 'Gera o arquivo com os dados exibidos e registra a exportação (RN11).', 'Quadro 51', 'F2-056')
S('O download só é permitido com status Concluído e dentro da validade da URL (RN11).', 'O arquivo não é armazenado no servidor; cada download gera o arquivo novamente (RN11).', 'Quadro 51', 'F2-056')
S('URL expirada: o sistema informa a expiração e orienta a solicitar uma nova geração.', 'Falha na geração: o sistema informa o erro e mantém o relatório em tela.', 'Quadro 51', 'F2-056')

# ============================================================ Apêndice B — dicionário de dados
# Quadro 57 (AuditoriaEvento)
L('Entidade afetada pela ação.', ['entidade_id', 'uuid', '', 'Identificador do registro afetado pela ação.'], 'Quadro 57 (nova linha)', 'F2-604')
S('Endereço IP de origem da ação.', 'Endereço IP de origem da ação (coluna reservada; não preenchida pela aplicação).', 'Quadro 57', 'F2-078')
S('Tipo de ação registrada (criação, login etc.).', 'Tipo de ação registrada: CRIACAO, ATUALIZACAO, DESATIVACAO, REATIVACAO, LOGIN, ENCERRAMENTO ou VISUALIZACAO (acesso a dado sigiloso); LOGOUT e EXPORTACAO são valores reservados, não gravados.', 'Quadro 57', 'F2-001, F2-582')
# Quadro 67 (Animal)
S('Número da medalha de identificação.', 'Número da medalha (plaqueta) de identificação; único quando informado.', 'Quadro 67', 'F2-310')
S('varchar(50)', 'varchar(30)', 'Quadro 67 (numero_medalha)', 'F2-310', oc=1)
S('Data de implantação do microchip.', 'Data de implantação do microchip (RN01); exige microchip informado e não pode ser futura.', 'Quadro 67', 'F2-311')
S('Identificador único do animal quando informado; registrado na implantação do chip (RN01).',
  'Identificador único do animal quando informado (coluna microchip, varchar(30)); registrado na implantação do chip e imutável depois de definido (RN01).', 'Quadro 67', 'F2-029')
S('Espécie do animal (canino, felino, quiróptero ou primata não humano).', 'Espécie do animal: FK para o catálogo especie (coluna especie_id; canino, felino, quiróptero ou primata não-humano).', 'Quadro 67', 'F2-325, F2-599')
S('Data de saída do canil, registrada com o destino (RF-A05).', 'Não implementado: a saída é registrada apenas pela mudança de status (limitação, Seção 3.5.2).', 'Quadro 67', 'F2-329')
S('Situação atual do animal.', 'Situação atual do animal: FK para o catálogo status_animal (coluna status_id).', 'Quadro 67', 'F2-330, F2-600', oc=1)
S('Data de entrada no canil.', 'Data e hora de entrada no canil (timestamp).', 'Quadro 67', 'F2-328')
S('Porte do animal (P/M/G).', 'Porte do animal (pequeno, medio ou grande; opcional).', 'Quadro 67', 'F2-169')
S('Tipo de pelagem do animal.', 'Tipo de pelagem do animal (curta ou longa).', 'Quadro 67', 'F2-170')
L('Data e hora da última atualização.',
  ['ficha_completa', 'boolean', '', 'Indicador calculado: campos obrigatórios, microchip e vacinação vigente (RN07).'], 'Quadro 67 (nova linha)', 'F2-609', oc=1)
L('Indicador calculado: campos obrigatórios, microchip e vacinação vigente (RN07).',
  ['laudo_eutanasia', 'text', '', 'Laudo do responsável técnico que justifica a eutanásia; obrigatório na transição para Óbito eutanásia (RF-A05).'], 'Quadro 67 (nova linha)', 'F2-008')
# Quadro 69 (AnexoAnimal)
S('URL de armazenamento do arquivo.', 'Tipo do arquivo (image/jpeg, image/png ou application/pdf); o conteúdo binário fica na tabela anexo_animal_conteudo (bytea).', 'Quadro 69', 'F2-007', oc=1)
R('url', 'mime_type', 'Quadro 69 (url)', 'F2-007', oc=1)
L('Tipo do arquivo (image/jpeg, image/png ou application/pdf); o conteúdo binário fica na tabela anexo_animal_conteudo (bytea).',
  ['descricao', 'varchar(200)', '', 'Descrição opcional do anexo.'], 'Quadro 69 (nova linha)', 'F2-007')
L('Descrição opcional do anexo.', ['criado_por_id', 'uuid', 'FK', 'Usuário que fez o upload (Usuario).'], 'Quadro 69 (nova linha)', 'F2-007')
# Quadro 70 (Vacinacao)
S('Data de validade da dose; base do alerta de reforço (RF-A03).', 'Atributo derivado: data de aplicação somada à validade da vacina; base do alerta de reforço (RF-A03). Não é coluna da tabela.', 'Quadro 70', 'F2-349')
L('Observações da aplicação.', ['retifica_id', 'uuid', 'FK/UQ', 'Registro anterior que este corrige (Vacinacao); correção sem alterar o original (RN06).'], 'Quadro 70 (nova linha)', 'F2-610')
# Quadro 72 (Procedimento) e 75 (Prescricao)
L('Descrição do procedimento.', ['retifica_id', 'uuid', 'FK/UQ', 'Registro anterior que este corrige (Procedimento) (RN06).'], 'Quadro 72 (nova linha)', 'F2-611')
L('Situação atual do tratamento.', ['retifica_id', 'uuid', 'FK/UQ', 'Registro anterior que este corrige (Prescricao) (RN06).'], 'Quadro 75 (nova linha)', 'F2-612')
# Quadro 76 (TipoExame)
L('Identificador único do tipo de exame.', ['codigo', 'varchar(30)', 'UQ', 'Código do tipo de exame (hemograma, sorologia, radiografia etc.).'], 'Quadro 76 (nova linha)', 'F2-007')
S('Nome do tipo de exame.', 'Nome do tipo de exame (não único; a unicidade é do código).', 'Quadro 76', 'F2-007')
# Quadro 77 (Exame)
S('Laboratório responsável (Laboratorio).', 'Laboratório responsável, quando informado (Laboratorio).', 'Quadro 77', 'F2-007')
L('Resultado do exame.', ['observacoes', 'text', '', 'Observações do exame.'], 'Quadro 77 (nova linha)', 'F2-007')
L('Observações do exame.', ['solicitado_por_id', 'uuid', 'FK', 'Usuário que registrou a solicitação (Usuario).'], 'Quadro 77 (nova linha)', 'F2-007')
L('Usuário que registrou a solicitação (Usuario).', ['retifica_id', 'uuid', 'FK/UQ', 'Registro anterior que este corrige (Exame) (RN06).'], 'Quadro 77 (nova linha)', 'F2-007')
# Quadro 84 (Ocorrencia)
S('Protocolo sequencial anual 0000/AAAA (RN02).', 'Protocolo sequencial anual NNN/AAAA (RN02).', 'Quadro 84', 'F2-058', oc=1)
S('Protocolo sequencial anual 0000/AAAA (RN02).', 'Protocolo sequencial anual NNN/AAAA (RN02).', 'Quadro 90', 'F2-058', oc=1)
S('Denunciante vinculado (Denunciante).', 'Denunciante vinculado (Denunciante). No esquema implementado a chave estrangeira fica na tabela Denunciante (ocorrencia_id, única).', 'Quadro 84', 'F2-452, F2-615')
S('Denunciado vinculado, quando houver (Denunciado).', 'Denunciado vinculado, quando houver (Denunciado). No esquema implementado a chave estrangeira fica na tabela Denunciado (ocorrencia_id, única).', 'Quadro 84', 'F2-453, F2-616')
L('Bairro da ocorrência.', ['endereco', 'varchar(255)', '', 'Endereço da ocorrência (obrigatório).'], 'Quadro 84 (nova linha)', 'F2-617')
L('Oculta dados do denunciante para não-Administradores (RN03).', ['anonima', 'boolean', '', 'Denúncia anônima, sem denunciante; excludente com sigilosa (RN03).'], 'Quadro 84 (nova linha)', 'F2-618')
S('Oculta dados do denunciante para não-Administradores (RN03).', 'Mascara os dados do denunciante para perfis sem a permissão denunciante_sigiloso (RN03).', 'Quadro 84', 'F2-059')
L('Denúncia anônima, sem denunciante; excludente com sigilosa (RN03).', ['latitude / longitude', 'decimal(9,6)', '', 'Coordenadas opcionais, reservadas para integração futura (sem mapa na versão atual).'], 'Quadro 84 (nova linha)', 'F2-619, F2-620')
L('Data e hora de encerramento.', ['encerrada_por_id', 'uuid', 'FK', 'Usuário que encerrou a ocorrência (Usuario).'], 'Quadro 84 (nova linha)', 'F2-621')
# Quadro 85 (AnexoOcorrencia)
S('URL de armazenamento do arquivo.', 'Tipo do arquivo (image/jpeg, image/png ou application/pdf); o conteúdo binário fica na tabela anexo_ocorrencia_conteudo (bytea).', 'Quadro 85', 'F2-468, F2-598, F2-622', oc=1)
R('url', 'mime_type', 'Quadro 85 (url)', 'F2-468', oc=1)
L('Tipo do arquivo (image/jpeg, image/png ou application/pdf); o conteúdo binário fica na tabela anexo_ocorrencia_conteudo (bytea).',
  ['criado_por_id', 'uuid', 'FK', 'Usuário que fez o upload (Usuario).'], 'Quadro 85 (nova linha)', 'F2-623', oc=1)
# Quadro 86 (MovimentacaoOcorrencia)
S('Tipo da movimentação registrada.', 'Tipo da movimentação: REGISTRADA, EQUIPE_DESPACHADA, PROCESSO_VINCULADO, AGUARDANDO_RESULTADO, ENCERRADA ou NOTA_INTERNA.', 'Quadro 86', 'F2-176, F2-569')
L('Tipo da movimentação: REGISTRADA, EQUIPE_DESPACHADA, PROCESSO_VINCULADO, AGUARDANDO_RESULTADO, ENCERRADA ou NOTA_INTERNA.',
  ['status_anterior / status_novo', 'varchar(20)', '', 'Transição de status da ocorrência registrada pela movimentação (ABERTA, EM_ATENDIMENTO, ENCERRADA), quando houver.'], 'Quadro 86 (nova linha)', 'F2-624, F2-625')
# Quadro 89 (ResponsavelProcesso)
L('Identificador único do responsável.', ['processo_id', 'uuid', 'FK/UQ', 'Processo ao qual o responsável pertence (ProcessoSanitario); relação 1:1 com a chave no responsável.'], 'Quadro 89 (nova linha)', 'F2-627')
S('CPF do responsável.', 'CPF do responsável (sem restrição de unicidade).', 'Quadro 89', 'F2-487')
# Quadro 90 (ProcessoSanitario)
S('Responsável pelo animal (ResponsavelProcesso).', 'Responsável pelo animal (ResponsavelProcesso). No esquema implementado a chave estrangeira fica em ResponsavelProcesso (processo_id).', 'Quadro 90', 'F2-502')
S('Resultado da análise laboratorial.', 'Resultado atual da análise: FK para o catálogo resultado_laboratorial (coluna resultado_laboratorial_id); o histórico fica em ResultadoProcesso.', 'Quadro 90', 'F2-500, F2-597, F2-601')
S('Desfecho do animal investigado.', 'Desfecho do animal investigado: FK para o catálogo desfecho_animal (coluna desfecho_animal_id).', 'Quadro 90', 'F2-501, F2-602')
S('Data de envio das amostras ao laboratório.', 'Data e hora de envio das amostras ao laboratório (timestamp).', 'Quadro 90', 'F2-508')
S('Data e hora do envio da notificação de resultado (RN10).', 'Data e hora do envio da notificação de resultado ao responsável (coluna data_notificacao_municipe, RN10).', 'Quadro 90', 'F2-014')
L('Doença investigada (Doenca).', ['cid', 'varchar(20)', '', 'Código CID da doença no momento da abertura (cópia do catálogo).'], 'Quadro 90 (nova linha)', 'F2-628')
# Quadro 92 (AmostraAnimal)
S('Espécie do animal amostrado (canino, felino, quiróptero ou primata não humano).', 'Espécie do animal amostrado: FK para o catálogo especie (coluna especie_id).', 'Quadro 92', 'F2-527')
S('Nome do animal amostrado.', 'Não implementado (removido da tabela animal_amostrado).', 'Quadro 92', 'F2-533')
S('Estado clínico observado.', 'Estado clínico observado: SINTOMATICO, ASSINTOMATICO ou OBITO.', 'Quadro 92', 'F2-593')
S('Tipo de material biológico coletado.', 'Material biológico coletado: TECIDO_ENCEFALICO, SORO, SANGUE, SALIVA ou URINA.', 'Quadro 92', 'F2-181')
S('Forma de conservação da amostra.', 'Não implementado (atributo e enumeração TipoAmostra não existem na tabela).', 'Quadro 92', 'F2-182, F2-538')
S('Nível de contato com humano.', 'Nível de contato com humano: DIRETA ou INDIRETA; preenchido somente quando há contato humano.', 'Quadro 92', 'F2-180')
# Quadro 94 (RelatorioGerado)
L('Identificador único do relatório.', ['doc_id', 'varchar(30)', 'UQ', 'Identificador legível da exportação, no formato DOC-AAAA-NNNN, gerado pela sequência anual (RN02).'], 'Quadro 94 (nova linha)', 'F2-629, F2-576')
S('Situação do processamento (RN11).', 'Não implementado: a exportação é síncrona e não há ciclo de estados (RN11).', 'Quadro 94', 'F2-555')
S('URL do arquivo gerado, com expiração.', 'Caminho ou nome do arquivo gerado, sem armazenamento do binário.', 'Quadro 94', 'F2-020')
S('Momento em que a URL do arquivo deixa de valer (RN11).', 'Não implementado: não há URL com expiração (RN11).', 'Quadro 94', 'F2-557')
S('Data e hora da solicitação.', 'Data e hora da exportação (timestamp com fuso).', 'Quadro 94', 'F2-020')
# Notas "modelado; implementação prevista em trabalhos futuros" nos quadros de entidades não implementadas
for q, ids in [('Quadro 63 – Dicionário de dados – tabela VacinaEspecie', 'F2-199'),
               ('Quadro 68 – Dicionário de dados – tabela AnimalSintoma', 'F2-204'),
               ('Quadro 71 – Dicionário de dados – tabela AnexoVacinacao', 'F2-207'),
               ('Quadro 73 – Dicionário de dados – tabela AnexoProcedimento', 'F2-209'),
               ('Quadro 78 – Dicionário de dados – tabela AnexoExame', 'F2-214'),
               ('Quadro 79 – Dicionário de dados – tabela Adocao', 'F2-215'),
               ('Quadro 88 – Dicionário de dados – tabela TipoDocumentoProcesso', 'F2-224'),
               ('Quadro 91 – Dicionário de dados – tabela DocumentoProcesso', 'F2-227')]:
    nome = q.split('tabela ')[-1]
    N(q, f'Nota: a tabela {nome} está modelada, mas não foi implementada nesta versão (implementação prevista em trabalhos futuros).', ids)
N('Quadro 67 – Dicionário de dados – tabela Animal',
  'Nota: no esquema implementado, os catálogos de espécie e de status são tabelas (especie e status_animal, com código e nome) referenciadas '
  'por chave estrangeira, em vez de enumerações; o mesmo vale para motivo de entrada, tipo de baia, doença, laboratório, resultado '
  'laboratorial e desfecho do animal, que possuem coluna codigo única.', 'F2-599–F2-602, F2-605–F2-608, F2-613, F2-614, F2-626')
N('Quadro 90 – Dicionário de dados – tabela ProcessoSanitario',
  'Nota: o histórico de resultados fica na tabela resultado_processo (id, processo_id, resultado_laboratorial_id, data_resultado, observacoes, '
  'retifica_id, registrado_por_id, registrado_em), imutável e com gatilhos que impedem exclusão (RN06); a numeração dos protocolos é mantida '
  'na tabela protocolo_sequencia (entidade, ano, ultimo) (RN02).', 'F2-596, F2-597')

S('Evidencia a numeração sequencial por ano, que o SISZOO padroniza no formato 0000/AAAA.',
  'Capa em papel do processo, com carimbo de protocolo numerado (007) e datado, e quadro de movimentação entre setores. Evidencia a '
  'numeração sequencial por ano, que o SISZOO padroniza no formato NNN/AAAA.', 'Apêndice D (descrição da Figura 52)', 'F2-058')

# ============================================================ Lista de Figuras (estática) e numeração do Apêndice E / Anexo A (F1)
R('Figura 48 – [DESCRIÇÃO DA FOTOGRAFIA]', 'Figura 48 – Ficha física de controle do canil', 'Lista de Figuras', 'F1 (lista × legendas)')
LISTA_49_55 = ['Figura 49 – Planilha de registro dos animais do canil', 'Figura 50 – Planilha de animais do canil com marcação por cores',
               'Figura 51 – Planilha de controle dos processos sanitários', 'Figura 52 – Capa de processo sanitário em manuseio',
               'Figura 53 – Ficha de notificação de cão com suspeita de leishmaniose visceral', 'Figura 54 – Requisição de exame no GAL']
APE = ['Relatório anual de processos', 'Relatório de vacinação', 'Relatório de adoções', 'Relatório de procedimentos',
       'Relatório de ocupação de baias', 'Relatório de ocorrências por bairro']
for i, novo in enumerate(LISTA_49_55):
    n = 49 + i
    R(f'Figura {n} – Tela T{18 + i}: {APE[i]}', novo, 'Lista de Figuras', 'F1 (figuras duplicadas 49–54)', oc=1)
R('Figura 55 – [PLANILHA E TRECHO APRESENTADO]', 'Figura 55 – Etiqueta de protocolo do GAL', 'Lista de Figuras', 'F1 (lista × legendas)')
NOVAS = ['Figura 56 – Requisição de exame molecular e notificação no SINAN', 'Figura 57 – Folha de coleta e exame laboratorial',
         'Figura 58 – Gráficos de casos suspeitos de zoonoses afixados em mural', 'Figura 59 – Gráficos de resultados laboratoriais afixados em mural'] + \
        [f'Figura {60 + i} – Tela T{18 + i}: {APE[i]}' for i in range(6)] + \
        ['Figura 66 – Trecho da planilha “Animais do Canil”', 'Figura 67 – Trecho da planilha “Animais do Canil”: cães e gatos por situação',
         'Figura 68 – Trecho da planilha “Controle de Processos Zoonoses”: processos por doença',
         'Figura 69 – Trecho da planilha “Controle de Processos Zoonoses”: processos aguardando resultado']
ancora = 'Figura 55 – Etiqueta de protocolo do GAL'
for novo in NOVAS:
    P(ancora, novo, 'Lista de Figuras (nova entrada; número de página a atualizar)', 'F1 (Lista de Figuras incompleta)', oc=1)
    ancora = novo
# legendas do corpo: Apêndice E 49–54 → 60–65 (as entradas da lista já foram trocadas, então só resta a ocorrência do corpo)
for i in range(6):
    R(f'Figura {49 + i} – Tela T{18 + i}: {APE[i]}', f'Figura {60 + i} – Tela T{18 + i}: {APE[i]}', 'Apêndice E (legenda)', 'F1 (figuras duplicadas 49–54)', oc=1)
S('Figura 56 –  Requisição de exame molecular e notificação no SINAN', 'Figura 56 – Requisição de exame molecular e notificação no SINAN', 'Apêndice D (legenda)', 'F1 (espaço duplo)')
ANEXO = ['Trecho da planilha “Animais do Canil”', 'Trecho da planilha “Animais do Canil”: cães e gatos por situação',
         'Trecho da planilha “Controle de Processos Zoonoses”: processos por doença', 'Trecho da planilha “Controle de Processos Zoonoses”: processos aguardando resultado']
for i, t in enumerate(ANEXO):
    R(f'Figura {60 + i} - {t}', f'Figura {66 + i} – {t}', 'Anexo A (legenda)', 'F1 (hífen × travessão; renumeração)', oc=1)

# ============================================================ Capturas de tela (23 figuras)
TELAS = [('T01', 'LOGIN', 'T01_login.png'), ('T02', 'DASHBOARD OPERACIONAL', 'T02_dashboard.png'), ('T03', 'ALERTAS', 'T03_alertas.png'),
         ('T04', 'ANIMAIS DO CANIL', 'T04_animais.png'), ('T05', 'CADASTRO DE ANIMAL', 'T05_cadastro_animal.png'),
         ('T06', 'FICHA DO ANIMAL', 'T06_ficha_animal.png'), ('T07', 'GESTÃO DE BAIAS', 'T07_gestao_baias.png'),
         ('T08', 'OCORRÊNCIAS', 'T08_ocorrencias.png'), ('T09', 'REGISTRO DE OCORRÊNCIA', 'T09_registro_ocorrencia.png'),
         ('T10', 'DETALHE DA OCORRÊNCIA', 'T10_detalhe_ocorrencia.png'), ('T11', 'PROCESSOS SANITÁRIOS', 'T11_processos.png'),
         ('T12', 'ABERTURA DE PROCESSO', 'T12_abertura_processo.png'), ('T13', 'DETALHE DO PROCESSO', 'T13_detalhe_processo.png'),
         ('T14', 'CENTRAL DE RELATÓRIOS', 'T14_central_relatorios.png'), ('T15', 'USUÁRIOS', 'T15_usuarios.png'),
         ('T16', 'CONFIGURAÇÕES', 'T16_configuracoes.png'), ('T17', 'PERFIL E AJUDA', 'T17_perfil.png'),
         ('T18', 'RELATÓRIO ANUAL DE PROCESSOS', 'T18_relatorio_anual_processos.png'), ('T19', 'RELATÓRIO DE VACINAÇÃO', 'T19_relatorio_vacinacao.png'),
         ('T20', 'RELATÓRIO DE ADOÇÕES', 'T20_relatorio_adocoes.png'), ('T21', 'RELATÓRIO DE PROCEDIMENTOS', 'T21_relatorio_procedimentos.png'),
         ('T22', 'RELATÓRIO DE OCUPAÇÃO DE BAIAS', 'T22_relatorio_ocupacao_baias.png'),
         ('T23', 'RELATÓRIO DE OCORRÊNCIAS POR BAIRRO', 'T23_relatorio_ocorrencias_bairro.png')]
for cod, nome, arq in TELAS:
    k.inserir_figura(f'[INSERIR CAPTURA DA TELA {cod} – {nome}]', os.path.join(CAP, arq), local=f'Figura da tela {cod}', id_item='Capturas (Fase 3)', nome_midia=f'fase3_{cod}.png')
# legenda T17 ("Perfil e Ajuda" → "Perfil"): lista e corpo
R('Figura 47 – Tela T17: Perfil e Ajuda', 'Figura 47 – Tela T17: Perfil', 'Lista de Figuras', 'F2-118', oc=1)
R('Figura 47 – Tela T17: Perfil e Ajuda', 'Figura 47 – Tela T17: Perfil', 'Seção 5.2 (legenda)', 'F2-118', oc=1)

k.marcar_update_fields()
k.salvar(DEST)

# ------------------------------------------------------------ log
with open(LOG, 'w', encoding='utf-8') as f:
    f.write('# Log de alterações do documento — Fase 3\n\n')
    f.write(f'Gerado em {datetime.date.today():%d/%m/%Y} por `scripts/editar_docx.py`. Origem: `SISZOO_versao_limpa.docx` (intacta). '
            f'Destino: `SISZOO_v2_alinhado.docx`.\n\n')
    f.write('Todas as alterações de texto, linhas de quadro e figuras foram gravadas como **controle de alterações** do Word '
            '(autor "Revisão SISZOO"); a única alteração aplicada diretamente é a marcação `w:updateFields` em `settings.xml`, '
            'para que o Word proponha atualizar o Sumário e a Lista de Quadros ao abrir. A Lista de Figuras é texto estático (não é campo): '
            'os títulos foram corrigidos e as entradas 56–69 inseridas, mas os **números de página** de todas as listas precisam ser '
            'conferidos pelos autores depois de aceitar as alterações (a inserção das 23 figuras desloca a paginação).\n\n')
    f.write(f'Total de operações: {len(k.log)}.\n\n')
    f.write('| # | Operação | Local | IDs | Antes | Depois | Controlada |\n|---|---|---|---|---|---|---|\n')
    for i, e in enumerate(k.log, 1):
        antes = (e['antes'] or '').replace('|', '\\|').replace('\n', ' ')
        depois = (e['depois'] or '').replace('|', '\\|').replace('\n', ' ')
        if len(antes) > 220: antes = antes[:217] + '...'
        if len(depois) > 320: depois = depois[:317] + '...'
        f.write(f"| {i} | {e['op']} | {e['local']} | {e['id']} | {antes} | {depois} | {'sim' if e['controlado'] else 'não'} |\n")
print('OK', len(k.log), 'operações ->', DEST)
