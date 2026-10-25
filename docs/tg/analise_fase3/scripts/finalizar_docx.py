# -*- coding: utf-8 -*-
"""Fase 4 — passo 2: edições finais (sem controle de alterações) sobre build/v3_aceito.docx.

Saída: build/v3_campos.docx (campos ainda não atualizados; o passo 3 usa o Word para isso).
Tudo o que é feito fica em log_alteracoes_fase4.md.
"""
import os, re, json, datetime, html
sys_path = os.path.dirname(os.path.abspath(__file__))
import sys; sys.path.insert(0, sys_path)
from docx_final import DocxFinal
from docx_kit import _esc

RAIZ = r'C:\Users\isaqu\Desktop\codigo\SISZOO\docs\tg'
ORIG = os.path.join(RAIZ, 'build', 'v3_aceito.docx')
DEST = os.path.join(RAIZ, 'build', 'v3_campos.docx')
CAP = os.path.join(RAIZ, 'analise_fase3', 'capturas')
LOG = os.path.join(RAIZ, 'analise_fase3', 'log_alteracoes_fase4.md')

k = DocxFinal(ORIG)
T = k.texto
PPR_CORPO = '<w:pPr><w:pStyle w:val="CorpoTexto"/></w:pPr>'
relatorio = {}

# ============================================================ 1. mídia das 7 capturas 1920×1080
for cod, arq in [('T14', 'T14_central_relatorios.png'), ('T18', 'T18_relatorio_anual_processos.png'), ('T19', 'T19_relatorio_vacinacao.png'),
                 ('T20', 'T20_relatorio_adocoes.png'), ('T21', 'T21_relatorio_procedimentos.png'), ('T22', 'T22_relatorio_ocupacao_baias.png'),
                 ('T23', 'T23_relatorio_ocorrencias_bairro.png')]:
    k.substituir_midia(f'fase3_{cod}.png', os.path.join(CAP, arq), local=f'Figura da tela {cod}', id_item='Capturas 1920×1080')

# ============================================================ 2. descrições das telas (Seção 5.2) e do Apêndice E
DESCR = {
 'A Figura 31 apresenta a tela T01': (
  'A Figura 31 apresenta a tela T01, de login, comum a todos os perfis. A tela é dividida em um painel institucional, com o nome e a '
  'descrição do sistema, e um formulário com os campos de e-mail institucional e senha, este com botão para exibir ou ocultar o texto '
  'digitado, além do botão “Entrar” e da indicação da versão em uso. O e-mail precisa pertencer ao domínio itu.sp.gov.br, e a senha é '
  'comparada com o hash armazenado (bcrypt); em caso de erro, o sistema informa apenas “credenciais inválidas”, sem revelar qual campo '
  'falhou (RF-C01, RNF06). Após a autenticação, o token JWT é guardado na sessão da aba do navegador e o usuário é direcionado ao '
  'dashboard; no primeiro acesso, ou quando o Administrador redefine a senha, o sistema exige a troca de senha em tela própria antes de '
  'liberar o restante do sistema. A tela corresponde ao caso de uso Realizar Login.'),
 'A Figura 32 apresenta a tela T02': (
  'A Figura 32 apresenta a tela T02, o dashboard operacional, primeira tela após o login. A barra lateral lista os módulos liberados para o '
  'cargo do usuário (RN09) e exibe, junto ao item Ocorrências, o número de ocorrências pendentes; a barra superior traz a busca global por '
  'animal, protocolo ou ocorrência e o menu do perfil. No corpo, a primeira linha mostra os indicadores do CCZ — total de animais sob '
  'custódia por espécie, percentual de animais vacinados, ocorrências registradas no dia e o cartão “Adoções no mês”, que é ilustrativo '
  'porque o sistema não registra a data da adoção. Em seguida vem o bloco de alertas críticos (reforço vacinal em sete dias, vacinas '
  'vencidas, animais sem avaliação há trinta dias, baias superlotadas e fichas incompletas), cada um com acesso direto à tela de '
  'tratamento, os gráficos de evolução construídos com Recharts e a lista de processos sanitários urgentes. Os indicadores são calculados '
  'por consultas agregadas com cache de cinco minutos (RF-D01, RF-A03). A tela corresponde ao caso de uso Visualizar Dashboard em Tempo '
  'Real e substitui as contagens e os gráficos montados manualmente pela direção.'),
 'A Figura 33 apresenta a tela T03': (
  'A Figura 33 apresenta a tela T03, de alertas vacinais, acessada a partir do dashboard. O cartão superior resume a situação — '
  'quantidade de vacinas em alerta, animais afetados, doses vencidas, doses a vencer e atraso médio — e lembra que a janela de '
  'antecedência é de sete dias (RF-A03). A tabela lista cada animal com espécie e sexo, baia, vacina, data de vencimento com a '
  'indicação de dias de atraso ou de dias restantes e o veterinário responsável pela última aplicação; o nome do animal abre a ficha '
  'correspondente. A data de vencimento é derivada da data de aplicação e do intervalo da vacina, não sendo digitada. Corresponde ao caso '
  'de uso Consultar Alertas Vacinais e substitui o controle de memória do reforço vacinal.'),
 'A Figura 34 apresenta a tela T04': (
  'A Figura 34 apresenta a tela T04, de listagem dos animais do canil. O cabeçalho informa o total cadastrado e oferece o botão “Novo '
  'animal” aos perfis com permissão de escrita; abaixo ficam a busca por nome ou microchip e os filtros por espécie, status e baia '
  '(RF-A02). Cada linha mostra avatar, nome e microchip, espécie, baia, status com cor própria (disponível, em tratamento, em quarentena, '
  'adotado, falecido, transferido), sexo, porte, data de entrada e indicação de castração, com atalho para edição. A lista é paginada no '
  'servidor, e o Agente Sanitário a acessa somente em modo de consulta (RN09). Corresponde ao caso de uso Consultar Animais por Baia e '
  'substitui a planilha de controle por baias.'),
 'A Figura 35 apresenta a tela T05': (
  'A Figura 35 apresenta a tela T05, de cadastro de animal, organizada em três etapas: dados básicos, saúde e baia, foto e revisão. Na '
  'primeira etapa são informados nome, espécie (canino, felino, primata não-humano ou quiróptero), microchip de quinze dígitos, data de '
  'implantação do chip, número da medalha, sexo, porte, raça, data provável de nascimento, pelagem, coloração, idade aproximada e peso; a '
  'segunda etapa recebe status, motivo de entrada, procedência, data de entrada, baia e esterilização; a terceira permite anexar a foto e '
  'revisar os dados. Os campos obrigatórios da RN07 são validados no navegador (Zod) e novamente no servidor, que também rejeita '
  'microchip ou medalha já cadastrados (RN01) e data de implantação sem microchip. O animal que chega sem microchip pode ser cadastrado e '
  'recebe o número quando o chip for implantado. O formulário salva rascunho local no IndexedDB, de modo que uma queda de rede não perde o '
  'preenchimento (RNF03), e a criação gera evento de auditoria. A tela corresponde ao caso de uso Cadastrar Animal e substitui a ficha '
  'manuscrita e o cadastro paralelo na plataforma AnimalTag.'),
 'A Figura 36 apresenta a tela T06': (
  'A Figura 36 apresenta a tela T06, ficha do animal. O cabeçalho reúne a identificação — nome, espécie, status, microchip, número da '
  'medalha, data de implantação do chip, procedência, baia, data de entrada, idade e peso — e o botão de edição, pelo qual se registra a '
  'saída do animal por mudança de status; no destino óbito por eutanásia, o laudo do responsável técnico é obrigatório (RF-A05). As abas '
  'Vacinações, Procedimentos, Prescrições e Exames listam o histórico clínico em ordem cronológica e abrem o formulário de novo registro em '
  'janela própria; esses registros não podem ser editados nem excluídos, e a correção gera um novo registro que retifica o anterior, com '
  'auditoria (RN06, RF-A04). O cartão de anexos aceita arquivos JPG, PNG ou PDF de até 5 MB, no máximo dez por animal, com download '
  'auditado. Os alertas de vacina do animal aparecem na própria ficha, e o Agente Sanitário a consulta em modo de leitura. O registro de '
  'adoção com dados do adotante está modelado; implementação prevista em trabalhos futuros. A tela substitui a ficha manuscrita.'),
 'A Figura 37 apresenta a tela T07': (
  'A Figura 37 apresenta a tela T07, de gestão de baias. O cabeçalho informa o número de baias e de animais alojados, a capacidade total, a '
  'taxa de ocupação geral e a quantidade de baias superlotadas, com legenda de cores para ocupação até 80 %, entre 80 % e 99 % e igual ou '
  'superior a 100 %. Os cartões são agrupados por tipo (externa, gatil e interna) e mostram barra de ocupação calculada pela contagem de '
  'animais alojados, avatares dos residentes, atalho “Ver animais” e ações de editar e excluir (RF-A02). Há busca por nome e filtros por '
  'tipo, lotação e situação, além do botão “Adicionar Baia”. Administrador e Veterinário criam e editam baias; a desativação e a exclusão '
  'lógica são restritas ao Administrador, e todas as operações geram auditoria. Corresponde aos casos de uso Gerenciar Baias e Monitorar '
  'Ocupação de Baias e substitui a planilha de controle por baias.'),
 'A Figura 38 apresenta a tela T08': (
  'A Figura 38 apresenta a tela T08, de listagem de ocorrências, com o total de registros e o botão “Registrar Ocorrência”. O gráfico de '
  'distribuição por bairro resume as ocorrências listadas, e a barra de filtros combina busca livre por protocolo, denunciante ou bairro, '
  'tipo, status e período da data de abertura (RF-E02). A tabela mostra protocolo no formato NNN/AAAA com marcador de urgência, data, tipo '
  'com ícone, bairro, denunciante, status (aberta, em atendimento ou encerrada), processo sanitário vinculado e o atalho para o detalhe. Em '
  'ocorrências sigilosas o nome do denunciante é substituído por “Sigiloso” pelo próprio servidor para os perfis sem a permissão '
  'correspondente, e em ocorrências anônimas aparece “Anônima”; o acesso de Administrador e Agente Sanitário aos dados sigilosos é '
  'registrado na trilha de auditoria (RN03). Substitui o caderno físico de ocorrências.'),
 'A Figura 39 apresenta a tela T09': (
  'A Figura 39 apresenta a tela T09, de registro de ocorrência, organizada em cinco blocos. O primeiro seleciona o tipo (suspeita de '
  'zoonose, infestação de morcegos, criação irregular, animal agressivo ou outros); o segundo recebe data e hora de abertura, endereço, '
  'bairro, ponto de referência, descrição e a marcação de urgência; o terceiro, os dados do denunciante — nome, CPF, telefone, e-mail, CEP '
  'e endereço, com preenchimento automático do endereço pelo CEP (ViaCEP) e digitação manual quando o serviço não responde — e os '
  'seletores “ocorrência sigilosa” e “denunciante anônimo”, mutuamente excludentes (RN03); o quarto, os dados opcionais do denunciado; e o '
  'quinto, os anexos (JPG, PNG ou PDF até 5 MB). CPF, telefone e CEP têm máscara e validação, e o protocolo NNN/AAAA é gerado pelo '
  'servidor no momento do registro (RN02), que também cria a movimentação inicial. O botão “Salvar rascunho” guarda o formulário no '
  'IndexedDB para continuação posterior (RNF03). Corresponde ao caso de uso Registrar Nova Ocorrência.'),
 'A Figura 40 apresenta a tela T10': (
  'A Figura 40 apresenta a tela T10, de detalhe da ocorrência. O cabeçalho traz protocolo, tipo, status e marcador de urgência; o corpo '
  'exibe os dados da abertura, o bloco de localização (apenas marcador visual, sem mapa georreferenciado, conforme a Seção 3.4), os dados do '
  'denunciante — mascarados quando a ocorrência é sigilosa e o usuário não tem a permissão — e do denunciado, os anexos com download '
  'auditado e o cartão do processo sanitário vinculado, a partir do qual se abre o processo ou se vincula um processo existente. A linha '
  'do tempo de movimentações registra cada transição de status (registrada, equipe despachada, processo vinculado, aguardando resultado e '
  'encerrada) e permite notas internas. O encerramento exige a providência tomada e, quando ela for “Outro”, a descrição; fica bloqueado '
  'enquanto o processo vinculado não estiver concluído (RN05), e a ocorrência encerrada torna-se imutável (RN06). Substitui o caderno de '
  'ocorrências.'),
 'A Figura 41 apresenta a tela T11': (
  'A Figura 41 apresenta a tela T11, de listagem dos processos sanitários. Os processos urgentes — aqueles com contato humano-animal em '
  'alguma amostra — ficam fixados no topo com destaque e o marcador “URGENTE” (RN04); as demais linhas seguem a ordem cronológica. Cada '
  'linha mostra protocolo, doença investigada com cor própria, status do ciclo (aberto, aguardando resultado, com resultado ou concluído, '
  'RN12), data de abertura, ocorrência vinculada e o atalho para o detalhe, e a lista é paginada e filtrável por doença e status (RF-B02). '
  'Agente Sanitário, Veterinário e Administrador têm acesso; o botão “Novo Processo” inicia a abertura. Substitui a planilha de controle '
  'de processos.'),
 'A Figura 42 apresenta a tela T12': (
  'A Figura 42 apresenta a tela T12, de abertura de processo sanitário, organizada em quatro etapas. A primeira permite vincular uma '
  'ocorrência aberta, localizada por protocolo, bairro ou denunciante, ou pular o vínculo, e recebe data de abertura, doença e laboratório '
  '(catálogos), os números do GAL e do SINAN — opcionais e registrados manualmente, sem integração com os sistemas estaduais — e '
  'observações (RF-B01). A segunda etapa cadastra o responsável pelo animal (nome obrigatório, CPF, telefone, e-mail, CEP com ViaCEP, '
  'endereço e bairros); a terceira registra as amostras, vinculadas a um animal do canil ou com dados próprios, incluindo espécie, sexo, '
  'estado clínico, tipo de abrigo, material biológico, data da coleta, sintomas e a indicação de contato humano, que exige o nível de '
  'contato e a informação de agressão (RF-B04); a quarta apresenta a revisão. Ao confirmar, o servidor gera o protocolo NNN/AAAA (RN02), '
  'valida os obrigatórios da RN08 e marca o processo como urgente quando houver contato humano (RF-B05). O formulário mantém rascunho '
  'local (RNF03). Corresponde aos casos de uso Abrir Processo Sanitário e Registrar Animal Amostrado.'),
 'A Figura 43 apresenta a tela T13': (
  'A Figura 43 apresenta a tela T13, de detalhe do processo. O cabeçalho mostra protocolo, doença, status e marcador de urgência; o corpo '
  'reúne os dados da abertura (datas, laboratório, números do GAL e do SINAN, observações e ocorrência de origem), o responsável, as '
  'amostras com seus sintomas e o cartão de resultado laboratorial. O registro do resultado é feito em janela própria, com o resultado do '
  'catálogo (aguardando, positivo, negativo, inconclusivo, material inadequado ou não realizado), a data e o desfecho do animal; cada '
  'lançamento é gravado em histórico imutável, a correção gera novo registro que retifica o anterior e o resultado positivo é definitivo '
  '(RN06, RF-B03). Resultado positivo ou inconclusivo dispara o e-mail ao responsável, cuja situação de envio aparece no cartão com a opção '
  'de reenvio manual (RN10); o e-mail à Vigilância Epidemiológica permanece como pendência. A conclusão do processo exige resultado '
  'registrado (RN12), e a tela exibe ainda a trilha de auditoria do próprio processo. Substitui a planilha de resultados.'),
 'A Figura 44 apresenta a tela T14': (
  'A Figura 44 apresenta a tela T14, central de relatórios. Cada um dos seis cartões descreve um relatório e oferece o filtro adequado — '
  'ano para o relatório anual de processos, janela de seis ou doze meses ou período livre para a ocupação de baias e período inicial e '
  'final para os demais — e o botão “Gerar Relatório”. A geração é síncrona: o relatório aparece em um painel de pré-visualização na '
  'própria tela, com indicadores e tabelas, e os botões “Baixar CSV” e “Baixar PDF” exportam o conteúdo exibido (RF-D02). A lista '
  '“Relatórios recentes” é o histórico de exportações registrado em RelatorioGerado, com tipo, período, autor, data, tamanho e a opção de '
  'gerar novamente (RN11); o arquivo não é armazenado no banco. As pré-visualizações de cada relatório são apresentadas no Apêndice E. '
  'Substitui os relatórios montados à mão.'),
 'A Figura 45 apresenta a tela T15': (
  'A Figura 45 apresenta a tela T15, de gestão de usuários, restrita ao Administrador. Os cartões superiores contam os usuários por cargo '
  '(Administrador, Veterinário e Agente Sanitário); abaixo ficam a busca por nome ou e-mail, os filtros por perfil e situação e a tabela com '
  'usuário, perfil, situação (ativo ou inativo), último acesso, data de criação e as ações de desativar ou reativar. O botão “Adicionar '
  'Usuário” abre o formulário de cadastro, em que se informam nome, sobrenome, e-mail institucional, telefone, CRMV quando aplicável e o '
  'cargo único do usuário; a senha inicial deve ser trocada no primeiro acesso (RF-C02). O Administrador não pode desativar a própria '
  'conta, a desativação invalida imediatamente o token do usuário e todas as ações geram auditoria (RNF10). A edição dos dados cadastrais '
  'de outros usuários ainda não foi implementada, e o respectivo botão fica desabilitado.'),
 'A Figura 46 apresenta a tela T16': (
  'A Figura 46 apresenta a tela T16, de configurações, dividida em “Preferências” e “Notificações”. Em preferências o usuário escolhe o '
  'tema (claro ou escuro) e a densidade da interface, que altera o espaçamento entre elementos; em notificações, ativa ou desativa os avisos '
  'de alertas críticos, vacina vencendo, superlotação, resultado laboratorial e resumo diário por e-mail. As escolhas são gravadas por '
  'usuário na entidade PreferenciaUsuario, aplicadas imediatamente à interface e não afetam os demais usuários (RF-C03).'),
 'A Figura 47 apresenta a tela T17': (
  'A Figura 47 apresenta a tela T17, de perfil do usuário. O cartão principal mostra avatar, nome, e-mail institucional e o cargo; o cartão '
  'de contato traz e-mail, registro profissional (CRMV) e a data de entrada no sistema; o formulário “Atualizar telefone” permite ao '
  'próprio usuário manter seu telefone de contato; e o painel “Permissões deste perfil” lista cada módulo com a indicação de acesso '
  'liberado ou negado conforme a matriz de permissões do cargo (RN09). O botão “Preferências” leva à tela T16, e a troca de senha pelo '
  'próprio usuário é feita na tela de troca de senha (RF-C01). A tela de ajuda prevista inicialmente não foi implementada.'),
}
for ancora, novo in DESCR.items():
    k.substituir_texto(ancora, novo, local='Seção 5.2', id_item='Correção 2 (descrições detalhadas)')

APE = [
 ('Figura 60 – Tela T18: Relatório anual de processos', 57,
  'A Figura 57 apresenta a pré-visualização do Relatório Anual de Processos, gerado para o ano selecionado. Os indicadores mostram os '
  'processos abertos no ano, os confirmados positivos com a taxa de positividade, os processos com contato humano (notificados ao SINAN) e o '
  'tempo médio, em dias, entre a abertura e o registro do resultado; seguem-se o sumário executivo e as tabelas de distribuição por '
  'patologia, resultados laboratoriais por doença, distribuição por espécie, bairros com mais ocorrências e laboratórios utilizados (RF-B07).'),
 ('Figura 61 – Tela T19: Relatório de vacinação', 58,
  'A Figura 58 apresenta o Relatório de Vacinação do período escolhido. Os indicadores informam as vacinas aplicadas, o percentual de animais '
  'vacinados entre os sob custódia, as doses vencidas e as doses a vencer em trinta dias; as tabelas detalham as aplicações por vacina, com '
  'cobertura atual e vencimentos próximos, as aplicações por veterinário e os animais com vacinas vencidas, com baia e dias de atraso.'),
 ('Figura 62 – Tela T20: Relatório de adoções', 59,
  'A Figura 59 apresenta o Relatório de Adoções, que mostra a quantidade atual de animais com status “Adotado” e o seu perfil por espécie e '
  'porte. Como o sistema ainda não registra a data da adoção, os dados do adotante nem as devoluções (entidade Adocao modelada para '
  'trabalhos futuros), o próprio painel exibe o aviso de que o relatório não é filtrado pelo período e de que os indicadores de tempo de '
  'permanência e de devolução não estão disponíveis.'),
 ('Figura 63 – Tela T21: Relatório de procedimentos', 60,
  'A Figura 60 apresenta o Relatório de Procedimentos do período. Os indicadores somam o total de procedimentos, as castrações (com a '
  'separação entre machos e fêmeas), os atendimentos clínicos e as cirurgias maiores; as tabelas mostram os procedimentos por tipo, a '
  'produtividade por veterinário (atendimentos, castrações, cirurgias, vacinações e total) e a relação das cirurgias realizadas.'),
 ('Figura 64 – Tela T22: Relatório de ocupação de baias', 61,
  'A Figura 61 apresenta o relatório de Ocupação de Baias, calculado sobre a situação atual das baias. Os indicadores trazem a ocupação '
  'média, as baias superlotadas, as baias no limite e a capacidade total; a tabela lista cada baia com capacidade, ocupação atual, '
  'percentual e situação (normal, próxima do limite ou superlotada). O histórico mensal e as transferências entre baias não são registrados.'),
 ('Figura 65 – Tela T23: Relatório de ocorrências por bairro', 62,
  'A Figura 62 apresenta o relatório de Ocorrências por Bairro do período. Os indicadores contam as ocorrências registradas, os bairros '
  'atingidos, o tempo médio de atendimento em horas e o percentual de ocorrências encerradas; as tabelas apresentam os bairros com mais '
  'ocorrências, com o tipo predominante e o tempo médio, e a quantidade por tipo de ocorrência, em forma tabular, sem georreferenciamento.'),
]
apE_ini = k.pos_legenda('APÊNDICE E', 1)
for legenda, _, texto in APE:
    ini, fim = k.pos_texto(legenda, exato=True, apos=apE_ini)
    novo = f'<w:p>{PPR_CORPO}{k._run_novo("", texto)}</w:p>'
    k.doc = k.doc[:ini] + novo + k.doc[ini:]
    k.log.append({'op': 'inserir', 'local': 'Apêndice E', 'id': 'Correção 2', 'antes': '', 'depois': texto[:120], 'controlado': False})

# ============================================================ 3. Apêndice D: remover fotos de monitor (Figs. 49–51)
def validar_apD(textos, bloco):
    assert bloco.count('<w:drawing>') == 3, bloco.count('<w:drawing>')
    legendas = [t for t in textos if re.match(r'^Figura \d+ – ', t)]
    assert [l[:9] for l in legendas] == ['Figura 49', 'Figura 50', 'Figura 51'], legendas
    for t in textos:
        assert (t == '' or t.startswith('Fonte:') or re.match(r'^Figura (49|50|51) – ', t)
                or t.startswith('Planilha eletrônica que reúne') or t.startswith('Páginas seguintes da planilha')
                or t.startswith('Planilha em que os processos')), t
apD_ini = k.pos_legenda('APÊNDICE D', 1)
k.remover_intervalo('Planilha eletrônica que reúne os animais alojados por baia', 'Capa em papel do processo, com carimbo de protocolo',
                    apos=apD_ini, validador=validar_apD, local='Apêndice D', id_item='Correção 5 (fotos repetidas)')
k.substituir_texto('Este apêndice reúne as fotografias feitas pelos autores na visita ao CCZ de Itu',
  'Este apêndice reúne as fotografias feitas pelos autores na visita ao CCZ de Itu em 9 de janeiro de 2026: a ficha física de controle do '
  'canil, os formulários e documentos dos processos sanitários e os gráficos afixados no mural da unidade. As planilhas eletrônicas em uso '
  'são reproduzidas no Anexo A. Os dados pessoais de munícipes e funcionários foram ocultados, em observância à Lei nº 13.709/2018 (LGPD).',
  apos=apD_ini, local='Apêndice D', id_item='Correção 5')
# Fontes sem ponto final (F1-060)
while True:
    try:
        k.substituir_texto('Fonte: Acervo dos autores (2026)', 'Fonte: Acervo dos autores (2026).', apos=apD_ini, exato=True, local='Apêndice D', id_item='F1-060')
    except ValueError:
        break
# Anexo A: fonte de documento não publicado (F1-057)
anexo_ini = k.pos_legenda('ANEXO A', 1)
for _ in range(4):
    k.substituir_texto('Fonte: Centro de Controle de Zoonoses de Itu (2026).',
                       'Fonte: planilhas cedidas pelo CCZ de Itu (2026), documento não publicado.', apos=anexo_ini, exato=True, local='Anexo A', id_item='F1-057')

# ============================================================ 4. legendas com SEQ + listas automáticas + Sumário
intro_ini, _ = k.pos_texto(' INTRODUÇÃO', exato=True)
MAPA_FIG = {n: (n if n <= 48 else n - 3) for n in range(1, 70)}
refs_corpo = []
# 4a) referências no corpo a figuras ≥ 49 (fora das legendas)
for ini, fim, p in list(k.paragrafos(intro_ini)):
    t = T(p)
    if re.match(r'^(Figura|Quadro) \d+ – ', t):
        continue
    for m in re.finditer(r'\bFiguras?\s+(\d+)', t):
        if int(m.group(1)) >= 49:
            refs_corpo.append((int(m.group(1)), t[:80]))
relatorio['referencias_figuras_49_mais'] = refs_corpo
# 4b) legendas → SEQ
n_fig = n_qua = 0
pos = intro_ini
while True:
    achado = None
    for ini, fim, p in k.paragrafos(pos):
        m = re.match(r'^(Figura|Quadro) (\d+) – (.+)$', T(p))
        if m and '<w:fldChar' not in p:
            achado = (ini, fim, m); break
    if not achado:
        break
    ini, fim, m = achado
    rotulo, num, titulo = m.group(1), int(m.group(2)), m.group(3).strip()
    if rotulo == 'Figura':
        novo_num = MAPA_FIG[num]; n_fig += 1
        assert novo_num == n_fig, (num, novo_num, n_fig, titulo)
    else:
        novo_num = num; n_qua += 1
        assert novo_num == n_qua, (num, n_qua, titulo)
    centralizar = (rotulo == 'Figura')
    _, novo_fim = k.legenda_seq(ini, fim, rotulo, novo_num, titulo, centralizar)
    pos = novo_fim
relatorio['legendas_seq'] = {'figuras': n_fig, 'quadros': n_qua}
# 4c) listas pré-textuais → campos TOC (remove entradas estáticas)
def substituir_lista(titulo, instr):
    ini_t, fim_t = k.pos_texto(titulo, exato=True)
    # entradas: do parágrafo seguinte até o parágrafo de quebra de página (exclusivo)
    fim_bloco = None
    for ini, fim, p in k.paragrafos(fim_t):
        if 'w:type="page"' in p or '<w:sectPr' in p:
            fim_bloco = ini; break
    assert fim_bloco
    removidos = sum(1 for _ in k.paragrafos(fim_t, fim_bloco))
    k.doc = k.doc[:fim_t] + k.campo_toc(instr) + k.doc[fim_bloco:]
    k.log.append({'op': 'lista_toc', 'local': titulo, 'id': 'Correção 6 (ABNT) / F1-051', 'antes': f'{removidos} entradas estáticas', 'depois': instr, 'controlado': False})
substituir_lista('LISTA DE FIGURAS', 'TOC \\h \\z \\c "Figura"')
substituir_lista('LISTA DE QUADROS', 'TOC \\h \\z \\c "Quadro"')
# 4d) Sumário: instrução por níveis de título
k.doc = k.doc.replace(' TOC \\h \\u \\z \\t &quot;Heading 1,1,Heading 2,2,Heading 3,3,&quot;', ' TOC \\o &quot;1-3&quot; \\h \\z \\u ')
k.doc = k.doc.replace(' TOC \\h \\u \\z \\t "Heading 1,1,Heading 2,2,Heading 3,3,"', ' TOC \\o "1-3" \\h \\z \\u ')
assert 'TOC \\o' in k.doc, 'instrução do Sumário não trocada'
k.doc = k.doc.replace('<w:t>No table of contents entries found.</w:t>', '<w:t>[Atualizar campo]</w:t>')
k.log.append({'op': 'sumario', 'local': 'SUMÁRIO', 'id': 'F1-052', 'antes': 'TOC \\t "Heading 1,1,…"', 'depois': 'TOC \\o "1-3" \\h \\z \\u', 'controlado': False})

# ============================================================ 5. pré-textual
for titulo in ['DEDICATÓRIA', 'EPÍGRAFE']:
    k.remover_paragrafo(titulo, exato=True, local='Pré-textual', id_item='Correção 6 (NBR 14724: sem título)')
# Resumo/Abstract em espaçamento simples
for ancora in ['O Centro de Controle de Zoonoses (CCZ) de Itu, unidade municipal responsável', 'The Zoonoses Control Center', 'Palavras-chave:', 'Keywords:']:
    ini, fim = k.pos_texto(ancora)
    k.definir_ppr(ini, fim, '<w:pPr><w:spacing w:after="120" w:line="240" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr>')
# quebra de página entre capa e folha de rosto
# quebra no fim do último parágrafo da capa ("2026"), não em parágrafo próprio (a capa já ocupa a página inteira)
ini, fim = k.pos_texto('2026', ocorrencia=1, exato=True)
k.doc = k.doc[:fim - len('</w:p>')] + '<w:r><w:br w:type="page"/></w:r>' + k.doc[fim - len('</w:p>'):]
k.log.append({'op': 'inserir', 'local': 'Capa → folha de rosto', 'id': 'Correção 6', 'antes': '', 'depois': 'quebra de página', 'controlado': False})
# título da capa com travessão
k.substituir_texto('SISZOO - SISTEMA DE GERENCIAMENTO', 'SISZOO – SISTEMA DE GERENCIAMENTO DO CENTRO DE ZOONOSES DA CIDADE DE ITU', local='Capa', id_item='Correção 6')
# lista de abreviaturas: + E2E, FK, NN, PK, RN, RNF, UQ; − UTC (N-09)
ini, fim = k.pos_texto('DER – Diagrama Entidade-Relacionamento', exato=True)
_, _, pmodelo = next(k.paragrafos(ini, fim + 1))
ab, ppr_ab, corpo_ab = k._ppr_e_runs(pmodelo)
rpr_ab = k._primeiro_rpr(corpo_ab)
def sigla_antes(ancora, texto):
    ini, fim = k.pos_texto(ancora, exato=True)
    k.doc = k.doc[:ini] + f'<w:p>{ppr_ab}{k._run_novo(rpr_ab, texto)}</w:p>' + k.doc[ini:]
sigla_antes('GAL – Gerenciador de Ambiente Laboratorial', 'E2E – End-to-End (testes ponta a ponta)')
sigla_antes('GAL – Gerenciador de Ambiente Laboratorial', 'FK – Foreign Key (chave estrangeira)')
sigla_antes('OHHLEP – One Health High-Level Expert Panel', 'NN – Not Null (campo obrigatório)')
sigla_antes('PNPR – Programa Nacional de Profilaxia da Raiva', 'PK – Primary Key (chave primária)')
sigla_antes('SINAN – Sistema de Informação de Agravos de Notificação', 'RN – Regra de Negócio')
sigla_antes('SINAN – Sistema de Informação de Agravos de Notificação', 'RNF – Requisito Não Funcional')
sigla_antes('UUID – Universally Unique Identifier', 'UQ – Unique (valor único)')
k.remover_paragrafo('UTC – Tempo Universal Coordenado', exato=True, local='Lista de abreviaturas', id_item='N-09')
k.log.append({'op': 'siglas', 'local': 'Lista de abreviaturas', 'id': 'F1-061', 'antes': '', 'depois': 'E2E, FK, NN, PK, RN, RNF, UQ', 'controlado': False})
# ordem: listas de figuras e quadros antes da lista de abreviaturas
lf_ini, _ = k.pos_texto('LISTA DE FIGURAS', exato=True)
sum_ini, _ = k.pos_texto('SUMÁRIO', exato=True)
# bloco = [LISTA DE FIGURAS … até o parágrafo de quebra antes de INTRODUÇÃO) — o parágrafo de quebra fica
intro_ini, _ = k.pos_texto(' INTRODUÇÃO', exato=True)
quebra_ini = k.doc.rfind('<w:p', 0, intro_ini)
bloco = k.doc[lf_ini:quebra_ini]
assert 'LISTA DE QUADROS' in bloco and 'SUMÁRIO' not in bloco
k.doc = k.doc[:lf_ini] + k.doc[quebra_ini:]
# o bloco entra antes do parágrafo de quebra que antecede "LISTA DE ABREVIATURAS"
la_ini, _ = k.pos_texto('LISTA DE ABREVIATURAS E SIGLAS', exato=True)
# a quebra que precede o SUMÁRIO continua lá; o bloco movido termina com a quebra que precedia o SUMÁRIO? não: termina no fim da lista de quadros
# inserir bloco + quebra de página antes de LISTA DE ABREVIATURAS
k.doc = k.doc[:la_ini] + bloco + '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' + k.doc[la_ini:]
k.log.append({'op': 'mover', 'local': 'Pré-textual', 'id': 'Correção 6 (NBR 14724 ordem)', 'antes': 'Sumário antes das listas', 'depois': 'Listas de figuras e quadros → abreviaturas → sumário', 'controlado': False})

# ============================================================ 6. numeração de páginas (seção pré-textual sem número)
intro_ini, _ = k.pos_texto(' INTRODUÇÃO', exato=True)
quebra_ini = k.doc.rfind('<w:p', 0, intro_ini)
quebra_fim = k.doc.find('</w:p>', quebra_ini) + len('</w:p>')
assert 'w:type="page"' in k.doc[quebra_ini:quebra_fim] and not T(k.doc[quebra_ini:quebra_fim]).strip()
SECT_PRE = ('<w:p><w:pPr><w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="11906" w:h="16838"/>'
            '<w:pgMar w:top="1701" w:right="1134" w:bottom="1134" w:left="1701" w:header="1134" w:footer="708" w:gutter="0"/>'
            '<w:pgNumType w:start="1"/><w:cols w:space="720"/></w:sectPr></w:pPr></w:p>')
k.doc = k.doc[:quebra_ini] + SECT_PRE + k.doc[quebra_fim:]
k.remover_rodapes()
rid_hdr = k.criar_cabecalho_pagina()
sects = [m for m in re.finditer(r'<w:sectPr[ >].*?</w:sectPr>', k.doc, flags=re.S)]
assert sects[0].start() < intro_ini + 2000 and 'pgNumType' in sects[0].group(0)
# 2 cm de cabeçalho em todas as seções; headerReference só na primeira seção do corpo; pgNumType só na pré-textual
novo_doc = k.doc[:sects[0].end()]
pos_ant = sects[0].end()
for i, m in enumerate(sects[1:], start=1):
    s = m.group(0)
    s = re.sub(r'<w:pgMar ([^>]*)w:header="\d+"', r'<w:pgMar \1w:header="1134"', s)
    s = s.replace('w:right="1138" w:bottom="1138"', 'w:right="1134" w:bottom="1134"')
    s = re.sub(r'<w:pgNumType[^>]*/>', '', s)
    if i == 1:
        s = re.sub(r'(<w:sectPr[^>]*>)', r'\1' + f'<w:headerReference w:type="default" r:id="{rid_hdr}"/>', s, count=1)
    novo_doc += k.doc[pos_ant:m.start()] + s
    pos_ant = m.end()
k.doc = novo_doc + k.doc[pos_ant:]
k.log.append({'op': 'secoes', 'local': 'sectPr', 'id': 'Correção 3 (numeração)', 'antes': '44 seções com rodapé PAGE desde a capa',
              'depois': f'seção pré-textual sem número (contada a partir de 1) + cabeçalho {rid_hdr} com PAGE a partir da Introdução', 'controlado': False})

# ============================================================ 7. estilos e corpo (ABNT)
k.substituir_estilo('Heading1',
  '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/>'
  '<w:pPr><w:keepNext/><w:pageBreakBefore/><w:spacing w:before="0" w:after="360" w:line="360" w:lineRule="auto"/><w:outlineLvl w:val="0"/></w:pPr>'
  '<w:rPr><w:b/><w:bCs/><w:caps/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>')
k.substituir_estilo('Heading2',
  '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:unhideWhenUsed/><w:qFormat/>'
  '<w:pPr><w:keepNext/><w:spacing w:before="360" w:after="240" w:line="360" w:lineRule="auto"/><w:outlineLvl w:val="1"/></w:pPr>'
  '<w:rPr><w:b/><w:bCs/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>')
k.substituir_estilo('Heading3',
  '<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:unhideWhenUsed/><w:qFormat/>'
  '<w:pPr><w:keepNext/><w:spacing w:before="240" w:after="240" w:line="360" w:lineRule="auto"/><w:outlineLvl w:val="2"/></w:pPr>'
  '<w:rPr><w:b/><w:bCs/><w:i/><w:iCs/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>')
k.adicionar_estilos(
  '<w:style w:type="paragraph" w:styleId="CorpoTexto"><w:name w:val="Corpo de texto ABNT"/><w:basedOn w:val="Normal"/><w:qFormat/>'
  '<w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="709"/><w:jc w:val="both"/></w:pPr></w:style>'
  '<w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="caption"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="35"/><w:unhideWhenUsed/><w:qFormat/>'
  '<w:pPr><w:keepNext/><w:spacing w:before="240" w:after="60" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:style>'
  '<w:style w:type="paragraph" w:styleId="TableofFigures"><w:name w:val="table of figures"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/>'
  '<w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9061"/></w:tabs><w:spacing w:after="60" w:line="240" w:lineRule="auto"/><w:ind w:left="1134" w:hanging="1134"/></w:pPr></w:style>'
  '<w:style w:type="paragraph" w:styleId="TOC1"><w:name w:val="toc 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:autoRedefine/><w:uiPriority w:val="39"/><w:unhideWhenUsed/>'
  '<w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9061"/></w:tabs><w:spacing w:before="120" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:b/><w:bCs/><w:caps/></w:rPr></w:style>'
  '<w:style w:type="paragraph" w:styleId="TOC2"><w:name w:val="toc 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:autoRedefine/><w:uiPriority w:val="39"/><w:unhideWhenUsed/>'
  '<w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9061"/></w:tabs><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="454"/></w:pPr></w:style>'
  '<w:style w:type="paragraph" w:styleId="TOC3"><w:name w:val="toc 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:autoRedefine/><w:uiPriority w:val="39"/><w:unhideWhenUsed/>'
  '<w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9061"/></w:tabs><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="907"/></w:pPr><w:rPr><w:i/><w:iCs/></w:rPr></w:style>'
  '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:basedOn w:val="DefaultParagraphFont"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:rPr><w:color w:val="000000"/><w:u w:val="none"/></w:rPr></w:style>')
# Normal: fonte explícita
k.substituir_estilo('Normal', '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/>'
  '<w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>')
k.log.append({'op': 'estilos', 'local': 'styles.xml', 'id': 'Correção 6 (ABNT)', 'antes': 'Heading1 14 pt sem quebra; sem Caption/TOC', 'depois': 'Heading1 12 pt caps + quebra; Heading3 itálico; CorpoTexto; Caption; TOC1-3; TableofFigures; Hyperlink', 'controlado': False})

# 7a) corpo: parágrafos de texto após a Introdução (fora de tabelas, sem estilo, justificados em 1,5)
intro_ini, _ = k.pos_texto(' INTRODUÇÃO', exato=True)
ref_ini, _ = k.pos_texto('REFERÊNCIAS', exato=True)
apA_ini, _ = k.pos_texto('APÊNDICE A – CASOS DE USO DE BAIXO NÍVEL', exato=True)
n_corpo = 0
pos = intro_ini
# reconstrução linear para evitar re-busca O(n²)
saida = []
ultimo = 0
prof = 0
for m in re.finditer(r'<w:tbl>|</w:tbl>|<w:p[ >](?:(?!<w:p[ >]).)*?</w:p>', k.doc, flags=re.S):
    tok = m.group(0)
    if tok == '<w:tbl>': prof += 1; continue
    if tok == '</w:tbl>': prof -= 1; continue
    if m.start() < intro_ini or prof > 0 or ref_ini <= m.start() < apA_ini:
        continue
    p = tok
    if '<w:pStyle' in p or '<w:drawing>' in p or '<w:numPr>' in p:
        continue
    t = T(p)
    if not t.strip() or t.startswith('Fonte:') or re.match(r'^(Figura|Quadro) \d', t):
        continue
    if 'w:val="both"' in p and 'w:line="360"' in p:
        novo = re.sub(r'<w:pPr>.*?</w:pPr>', lambda mm: PPR_CORPO.replace('</w:pPr>', (re.search(r'<w:sectPr.*?</w:sectPr>', mm.group(0), flags=re.S).group(0) if '<w:sectPr' in mm.group(0) else '') + '</w:pPr>'), p, count=1, flags=re.S)
        if novo != p:
            saida.append((m.start(), m.end(), novo)); n_corpo += 1
# aplica de trás para frente
for ini, fim, novo in reversed(saida):
    k.doc = k.doc[:ini] + novo + k.doc[fim:]
k.log.append({'op': 'corpo', 'local': 'Introdução → Considerações Finais; apêndices', 'id': 'Correção 6 (recuo 1,25 cm; 1,5)', 'antes': 'formatação direta', 'depois': f'{n_corpo} parágrafos com estilo CorpoTexto', 'controlado': False})

# 7b) Referências: alinhadas à esquerda, espaçamento simples, entrada separada por espaço depois
ref_ini, _ = k.pos_texto('REFERÊNCIAS', exato=True)
apA_ini, _ = k.pos_texto('APÊNDICE A – CASOS DE USO DE BAIXO NÍVEL', exato=True)
bloco = k.doc[ref_ini:apA_ini]
novos = []
n_ref = n_vazios = 0
for m in re.finditer(r'<w:p[ >](?:(?!<w:p[ >]).)*?</w:p>', bloco, flags=re.S):
    p = m.group(0)
    if '<w:pStyle' in p or '<w:sectPr' in p:
        continue
    if not T(p).strip():
        novos.append((m.start(), m.end(), '')); n_vazios += 1; continue
    ab, ppr, corpo = k._ppr_e_runs(p)
    novos.append((m.start(), m.end(), f'{ab}<w:pPr><w:spacing w:after="240" w:line="240" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr>{corpo}</w:p>')); n_ref += 1
for ini, fim, novo in reversed(novos):
    bloco = bloco[:ini] + novo + bloco[fim:]
k.doc = k.doc[:ref_ini] + bloco + k.doc[apA_ini:]
k.log.append({'op': 'referencias', 'local': 'REFERÊNCIAS', 'id': 'Correção 6 (NBR 6023)', 'antes': f'{n_vazios} parágrafos vazios separadores', 'depois': f'{n_ref} entradas simples, à esquerda, 12 pt depois', 'controlado': False})

# 7c) quebras manuais imediatamente antes de Heading1 (agora pageBreakBefore) — remove parágrafo só-quebra ou o run de quebra
n_q = 0
for m in list(re.finditer(r'<w:p[ >](?:(?!<w:p[ >]).)*?</w:p>', k.doc, flags=re.S))[::-1]:
    p = m.group(0)
    if 'w:val="Heading1"' not in p:
        continue
    prev_ini = k.doc.rfind('<w:p', 0, m.start())
    prev = k.doc[prev_ini:m.start()]
    if 'w:type="page"' in prev and '<w:sectPr' not in prev:
        if not T(prev).strip():
            k.doc = k.doc[:prev_ini] + k.doc[m.start():]; n_q += 1
        else:
            k.doc = k.doc[:prev_ini] + re.sub(r'<w:r>(?:<w:rPr>.*?</w:rPr>)?<w:br w:type="page"/></w:r>', '', prev, flags=re.S) + k.doc[m.start():]; n_q += 1
k.log.append({'op': 'quebras', 'local': 'títulos de seção primária', 'id': 'Correção 6', 'antes': 'quebras manuais', 'depois': f'{n_q} removidas (pageBreakBefore no estilo)', 'controlado': False})
# o título " INTRODUÇÃO" tem espaço à esquerda
k.doc = k.doc.replace('<w:t xml:space="preserve"> INTRODUÇÃO</w:t>', '<w:t>INTRODUÇÃO</w:t>')
# Heading2 do cap. 1 com <w:caps/> redundante: inofensivo, mantido.

# 7d) "Fonte:" — 10 pt simples; centralizada após figura, à esquerda após quadro; imagens soltas centralizadas
n_f = 0
for m in list(re.finditer(r'<w:p[ >](?:(?!<w:p[ >]).)*?</w:p>', k.doc, flags=re.S))[::-1]:
    p = m.group(0)
    t = T(p)
    if t.startswith('Fonte:'):
        anterior = k.doc[max(0, m.start() - 6000):m.start()]
        pos_fig = anterior.rfind('<w:drawing>'); pos_tbl = anterior.rfind('</w:tbl>'); pos_p = anterior.rfind('</w:p>')
        apos_figura = pos_fig != -1 and (pos_tbl == -1 or pos_fig > pos_tbl - 1500) and (pos_p - pos_fig < 2500)
        jc = '<w:jc w:val="center"/>' if apos_figura else ''
        ab, ppr, corpo = k._ppr_e_runs(p)
        sect = re.search(r'<w:sectPr.*?</w:sectPr>', ppr, flags=re.S)
        novo_ppr = f'<w:pPr><w:spacing w:before="60" w:after="240" w:line="240" w:lineRule="auto"/>{jc}{sect.group(0) if sect else ""}</w:pPr>'
        k.doc = k.doc[:m.start()] + f'{ab}{novo_ppr}{corpo}</w:p>' + k.doc[m.end():]; n_f += 1
    elif '<w:drawing>' in p and 'w:val="center"' not in p:
        ab, ppr, corpo = k._ppr_e_runs(p)
        k.doc = k.doc[:m.start()] + f'{ab}<w:pPr><w:jc w:val="center"/></w:pPr>{corpo}</w:p>' + k.doc[m.end():]
k.log.append({'op': 'fontes', 'local': 'linhas "Fonte:" e imagens soltas', 'id': 'Correção 6', 'antes': '', 'depois': f'{n_f} fontes padronizadas; imagens do Ap. D/Anexo A centralizadas', 'controlado': False})
# Quadro 1: autospacing de importação HTML
k.doc = k.doc.replace(' w:beforeAutospacing="1"', '').replace(' w:afterAutospacing="1"', '')

# ============================================================ 8. citações × referências (F1-055/056)
k.substituir_texto('Gráficos do painel de indicadores', 'Gráficos do painel de indicadores (RECHARTS, 2026)', exato=True, local='Quadro 14', id_item='F1-055')
k.substituir_texto('Site do CCZ de São José dos Campos (2022)', 'Site do CCZ de São José dos Campos (RIBEIRO, 2022)', exato=True, local='Quadro 2', id_item='F1-055')
ini, fim = k.pos_texto('“Eu Adoto no CCZ”, que exibe os animais disponíveis para adoção (SÃO PAULO, 2017).')
p = k.doc[ini:fim]
t_antigo = T(p)
t_novo = ('Em São José dos Campos, a Prefeitura lançou em 2022 o site do CCZ com adoção on-line de cães e gatos (RIBEIRO, 2022). Em São '
          'Paulo, a capital mantém o portal ' + t_antigo)
k.substituir_texto('“Eu Adoto no CCZ”, que exibe os animais disponíveis para adoção (SÃO PAULO, 2017).', t_novo, local='Seção 1.9', id_item='F1-056')

# ============================================================ salvar + log
k.salvar(DEST)
relatorio['operacoes'] = len(k.log)
with open(LOG, 'w', encoding='utf-8') as f:
    f.write('# Log de alterações do documento — Fase 4 (versão final, sem controle de alterações)\n\n')
    f.write(f'Gerado em {datetime.date.today():%d/%m/%Y} por `scripts/finalizar_docx.py` sobre `build/v3_aceito.docx` '
            '(= v2 com todas as alterações aceitas no Word). Saída: `build/v3_campos.docx` → `SISZOO_v3_final.docx` após atualização dos campos no Word.\n\n')
    f.write(f'Legendas convertidas em campos SEQ: {relatorio["legendas_seq"]}. Referências a Figuras ≥ 49 fora de legendas: {relatorio["referencias_figuras_49_mais"] or "nenhuma"}.\n\n')
    f.write('| # | Operação | Local | IDs | Antes | Depois |\n|---|---|---|---|---|---|\n')
    for i, e in enumerate(k.log, 1):
        a = (e['antes'] or '').replace('|', '\\|').replace('\n', ' ')[:200]
        d = (e['depois'] or '').replace('|', '\\|').replace('\n', ' ')[:260]
        f.write(f"| {i} | {e['op']} | {e['local']} | {e['id']} | {a} | {d} |\n")
print(json.dumps(relatorio, ensure_ascii=False))
print('OK ->', DEST)
