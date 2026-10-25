# -*- coding: utf-8 -*-
"""Seed de DEMONSTRAÇÃO para as capturas de tela do TG (Fase 3) — somente dados FICTÍCIOS.

Popula o banco de desenvolvimento local pela API REST do SISZOO (respeita regras,
protocolo, auditoria e imutabilidade), nunca por SQL direto. NÃO faz parte do
código do sistema e não deve ser commitado no repositório do produto.

Uso:  py -3 docs/tg/analise_fase3/capturas/seed_demo.py
Pré-requisitos: backend em http://localhost:8080 (docker compose, perfil docker)
com o admin do DataSeeder criado; credenciais lidas do .env da raiz (ADMIN_SEED_*).
Idempotência: usuários já existentes são reaproveitados (login direto); as demais
entidades são criadas de novo a cada execução (rode uma vez por banco limpo).
"""
import json, os, re, sys, io, urllib.request, urllib.error, datetime as dt, random, struct, zlib, uuid

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
API = os.environ.get('API', 'http://localhost:8080')
RAIZ = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
ENV = open(os.path.join(RAIZ, '.env'), encoding='utf-8').read()
def env(k): return re.search(r'^' + k + r'=(.*)$', ENV, re.M).group(1).strip()
HOJE = dt.date.today()
SENHA_DEMO = 'Demo@2026!'
random.seed(2026)
ETAPAS = set(sys.argv[1].split(',')) if len(sys.argv) > 1 else {'usuarios', 'baias', 'animais', 'clinico', 'ocorrencias', 'processos', 'relatorios', 'exames'}
def etapa(n): return n in ETAPAS

# ------------------------------------------------------------------ HTTP
def req(metodo, caminho, token=None, corpo=None, multipart=None):
    url = API + caminho
    cab = {'Accept': 'application/json'}
    if token: cab['Authorization'] = 'Bearer ' + token
    dados = None
    if multipart is not None:
        limite = '----siszoo' + uuid.uuid4().hex
        nome_campo, nome_arq, mime, conteudo = multipart
        partes = (f'--{limite}\r\nContent-Disposition: form-data; name="{nome_campo}"; filename="{nome_arq}"\r\n'
                  f'Content-Type: {mime}\r\n\r\n').encode() + conteudo + f'\r\n--{limite}--\r\n'.encode()
        cab['Content-Type'] = f'multipart/form-data; boundary={limite}'; dados = partes
    elif corpo is not None:
        cab['Content-Type'] = 'application/json'; dados = json.dumps(corpo).encode('utf-8')
    r = urllib.request.Request(url, data=dados, method=metodo, headers=cab)
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            texto = resp.read().decode('utf-8')
            return resp.status, (json.loads(texto) if texto else None)
    except urllib.error.HTTPError as e:
        texto = e.read().decode('utf-8', 'replace')
        try: return e.code, json.loads(texto)
        except Exception: return e.code, texto

def ok(status, corpo, oque):
    if status >= 300:
        raise SystemExit(f'FALHA {oque}: HTTP {status} {str(corpo)[:300]}')
    return corpo

def login(email, senha):
    s, c = req('POST', '/api/auth/login', corpo={'email': email, 'senha': senha})
    return ok(s, c, f'login {email}')['token']

# ------------------------------------------------------------------ utilidades de dados fictícios
def cpf_valido(semente):
    rnd = random.Random(semente); n = [rnd.randint(0, 9) for _ in range(9)]
    for _ in range(2):
        soma = sum(d * p for d, p in zip(n, range(len(n) + 1, 1, -1)))
        n.append((soma * 10 % 11) % 10)
    return '%d%d%d.%d%d%d.%d%d%d-%d%d' % tuple(n)

def png_minusculo():
    # PNG 2x2 vermelho, gerado em memória (anexo de demonstração)
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    raw = b''.join(b'\x00' + b'\xc6\x28\x28' * 2 for _ in range(2))
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 2, 2, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b''))

def d(dias_atras): return (HOJE - dt.timedelta(days=dias_atras)).isoformat()
def dh(dias_atras, hora='09:30:00'): return f'{d(dias_atras)}T{hora}'

# ------------------------------------------------------------------ 1. usuários
admin_tok = login(env('ADMIN_SEED_EMAIL'), env('ADMIN_SEED_PASSWORD'))
USUARIOS = [
    ('Mariana', 'Souza', 'mariana.souza@itu.sp.gov.br', 'Veterinário', 'SP-45678'),
    ('Joao', 'Almeida', 'joao.almeida@itu.sp.gov.br', 'Veterinário', 'SP-91234'),
    ('Carlos', 'Pereira', 'carlos.pereira@itu.sp.gov.br', 'Agente Sanitário', None),
    ('Fernanda', 'Lima', 'fernanda.lima@itu.sp.gov.br', 'Agente Sanitário', None),
    ('Ricardo', 'Nogueira', 'ricardo.nogueira@itu.sp.gov.br', 'Administrador', None),
]
tokens = {}
for nome, sobrenome, email, cargo, crmv in USUARIOS:
    s, c = req('POST', '/api/usuarios', admin_tok, {'nome': nome, 'sobrenome': sobrenome, 'email': email, 'cargo': cargo,
                                                     'crmv': crmv, 'telefone': '(11) 4023-0000', 'senhaInicial': SENHA_DEMO})
    print('usuario', email, s)
    tok = login(email, SENHA_DEMO)
    if s < 300:
        # primeiro acesso: troca obrigatória de senha (mantém a senha de demonstração)
        req('POST', '/api/auth/senha', tok, {'novaSenha': SENHA_DEMO, 'confirmarSenha': SENHA_DEMO})
    tokens[email] = login(email, SENHA_DEMO)
vet = tokens['mariana.souza@itu.sp.gov.br']; vet2 = tokens['joao.almeida@itu.sp.gov.br']
agente = tokens['carlos.pereira@itu.sp.gov.br']; agente2 = tokens['fernanda.lima@itu.sp.gov.br']
# um usuário desativado para a tela de usuários
s, c = (999, None)
if etapa('usuarios'): s, c = req('POST', '/api/usuarios', admin_tok, {'nome': 'Paulo', 'sobrenome': 'Ramos', 'email': 'paulo.ramos@itu.sp.gov.br',
                                                 'cargo': 'Agente Sanitário', 'crmv': None, 'telefone': None, 'senhaInicial': SENHA_DEMO})
if s < 300: req('PATCH', f"/api/usuarios/{c['id']}/status", admin_tok, {'ativo': False})

# ------------------------------------------------------------------ 2. baias
BAIAS = [('Baia 1', 'interna', 4), ('Baia 2', 'interna', 4), ('Baia 3', 'interna', 3), ('Baia 4', 'interna', 4),
         ('Baia 5', 'interna', 2), ('Baia 6', 'interna', 4), ('Gatil A', 'gatil', 6), ('Gatil B', 'gatil', 4),
         ('Externa 1', 'externa', 8), ('Externa 2', 'externa', 8), ('Corredor', 'externa', 3)]
baias = {}
if not etapa('baias'):
    for b in ok(*req('GET', '/api/baias?tamanho=100', admin_tok), 'listar baias')['itens']: baias[b['nome']] = b['id']
for nome, tipo, cap in (BAIAS if etapa('baias') else []):
    c = ok(*req('POST', '/api/baias', admin_tok, {'nome': nome, 'tipoBaia': tipo, 'capacidade': cap,
                                                  'finalidade': 'Quarentena' if nome == 'Baia 5' else None, 'observacoes': None}), 'baia ' + nome)
    baias[nome] = c['id']
print('baias', len(baias))

# ------------------------------------------------------------------ 3. animais
def chip(i): return '985' + str(1210000000000 + i * 7919).zfill(12)[:12]
ANIMAIS = [
    # nome, especie, sexo, raca, cor, pelagem, porte, peso, idade, status, motivo, dias_entrada, baia, chip?, medalha, procedencia, laudo
    ('Thor', 'canino', 'macho', 'SRD', 'Caramelo', 'curta', 'medio', 18.5, '3 anos', 'disponivel_adocao', 'recolhimento', 120, 'Baia 1', True, 'M-0101', 'Recolhido na Av. Sete Quedas, Vila Progresso', None),
    ('Luna', 'canino', 'femea', 'SRD', 'Preta', 'curta', 'pequeno', 9.2, '2 anos', 'em_tratamento', 'abandono', 40, 'Baia 1', True, 'M-0102', 'Abandonada em frente ao CCZ', None),
    ('Rex', 'canino', 'macho', 'Pastor Alemão', 'Preto e marrom', 'longa', 'grande', 32.0, '5 anos', 'em_quarentena', 'apreensao_judicial', 12, 'Baia 5', True, None, 'Apreensão judicial, bairro Cidade Nova', None),
    ('Mel', 'canino', 'femea', 'Poodle', 'Branca', 'longa', 'pequeno', 6.8, '7 anos', 'disponivel_adocao', 'entrega_voluntaria', 200, 'Baia 2', True, 'M-0104', 'Entrega voluntária do tutor', None),
    ('Bidu', 'canino', 'macho', 'SRD', 'Tigrado', 'curta', 'medio', 15.0, '4 anos', 'disponivel_adocao', 'resgate', 90, 'Baia 2', False, None, 'Resgatado no Jardim Novo Itu', None),
    ('Nina', 'canino', 'femea', 'SRD', 'Caramelo', 'curta', 'medio', 14.3, '1 ano', 'em_tratamento', 'recolhimento', 25, 'Baia 3', True, None, 'Recolhida no Centro', None),
    ('Zeus', 'canino', 'macho', 'Rottweiler', 'Preto', 'curta', 'grande', 41.0, '6 anos', 'em_quarentena', 'recolhimento', 5, 'Baia 5', True, 'M-0107', 'Recolhido após ocorrência no Bairro Brasil', None),
    ('Pipoca', 'canino', 'femea', 'SRD', 'Branca e preta', 'curta', 'pequeno', 7.5, '8 meses', 'disponivel_adocao', 'abandono', 60, 'Baia 4', True, None, 'Abandonada no Pirapitingui', None),
    ('Mia', 'felino', 'femea', 'SRD', 'Cinza', 'curta', 'pequeno', 3.8, '2 anos', 'disponivel_adocao', 'resgate', 150, 'Gatil A', True, 'M-0201', 'Resgatada no Jardim Aeroporto', None),
    ('Tom', 'felino', 'macho', 'SRD', 'Laranja', 'curta', 'pequeno', 4.5, '3 anos', 'em_tratamento', 'recolhimento', 30, 'Gatil A', True, None, 'Recolhido na Vila Padre Bento', None),
    ('Frida', 'felino', 'femea', 'Siamês', 'Creme', 'curta', 'pequeno', 3.2, '4 anos', 'disponivel_adocao', 'entrega_voluntaria', 75, 'Gatil A', True, 'M-0203', 'Entrega voluntária', None),
    ('Simba', 'felino', 'macho', 'SRD', 'Amarelo', 'longa', 'pequeno', 5.1, '1 ano', 'em_quarentena', 'resgate', 8, 'Gatil B', False, None, 'Resgatado no Parque das Rosas', None),
    ('Bolt', 'canino', 'macho', 'SRD', 'Branco', 'curta', 'grande', 27.0, '3 anos', 'adotado', 'resgate', 300, None, True, None, 'Resgatado no Bairro Brasil', None),
    ('Amora', 'canino', 'femea', 'SRD', 'Preta', 'curta', 'medio', 12.0, '9 anos', 'obito_eutanasia', 'recolhimento', 180, None, True, None, 'Recolhida na Rodovia SP-75', 'Quadro clínico irreversível (neoplasia disseminada); eutanásia indicada pelo responsável técnico conforme Lei nº 14.228/2021, art. 2º, § 1º.'),
    ('Chico', 'canino', 'macho', 'SRD', 'Caramelo', 'curta', 'medio', 16.0, '2 anos', 'transferido', 'recolhimento', 240, None, True, None, 'Recolhido no Jardim Aeroporto', None),
    ('Lola', 'canino', 'femea', 'SRD', 'Marrom', 'curta', 'pequeno', 8.0, '5 anos', 'disponivel_adocao', 'abandono', 110, 'Externa 1', True, 'M-0115', 'Abandonada no Jardim Padre Bento', None),
    ('Max', 'canino', 'macho', 'Labrador', 'Chocolate', 'curta', 'grande', 30.0, '4 anos', 'disponivel_adocao', 'entrega_voluntaria', 55, 'Externa 1', True, None, 'Entrega voluntária do tutor', None),
    ('Fumaça', 'felino', 'femea', 'SRD', 'Cinza', 'curta', 'pequeno', 3.0, '6 meses', 'em_tratamento', 'resgate', 15, 'Gatil B', False, None, 'Resgatada no Centro', None),
]
animais = {}
if not etapa('animais'):
    for a in ok(*req('GET', '/api/animais?tamanho=100', vet), 'listar animais')['itens']: animais[a['nome']] = a['id']
for i, a in enumerate(ANIMAIS if etapa('animais') else [], 1):
    nome, esp, sexo, raca, cor, pel, porte, peso, idade, status, motivo, dias, baia, tem_chip, medalha, proc, laudo = a
    corpo = {'nome': nome, 'especie': esp, 'sexo': sexo, 'raca': raca, 'coloracao': cor, 'pelagem': pel, 'porte': porte,
             'pesoKg': peso, 'idadeAprox': idade, 'dataNascimentoAprox': None, 'microchip': chip(i) if tem_chip else None,
             'esterilizado': i % 3 != 0, 'dataEsterilizacao': d(dias - 10) if (i % 3 != 0 and dias > 10) else None,
             'status': status, 'motivoEntrada': motivo, 'dataEntrada': dh(dias), 'baiaId': baias.get(baia), 'fotoUrl': None,
             'observacoes': 'Dócil, convive bem com outros animais.' if i % 2 else None,
             'numeroMedalha': medalha, 'dataImplantacaoChip': d(dias - 2) if tem_chip and dias > 2 else None,
             'procedencia': proc, 'laudoEutanasia': laudo}
    s, c = req('POST', '/api/animais', vet, corpo)
    if s >= 300:
        print('animal', nome, s, str(c)[:200]); continue
    animais[nome] = c['id']
print('animais', len(animais))

# ------------------------------------------------------------------ 4. histórico clínico
# vacinações: vigentes, vencendo em até 7 dias (aplicadas ~ 12 meses atrás) e vencidas
VAC = [('Thor', 'antirrabica', 100, 1), ('Thor', 'v10', 100, 2), ('Luna', 'antirrabica', 362, 1), ('Mel', 'antirrabica', 364, 2),
       ('Bidu', 'v8', 400, 1), ('Nina', 'antirrabica', 20, 1), ('Pipoca', 'v10', 50, 1), ('Mia', 'v4_felinos', 361, 1),
       ('Tom', 'antirrabica', 420, 1), ('Frida', 'v4_felinos', 30, 2), ('Lola', 'antirrabica', 380, 1), ('Max', 'v10', 10, 1),
       ('Mel', 'v8', 90, 1), ('Zeus', 'antirrabica', 3, 1)]
SOMENTE_VAC = set(os.environ.get('VAC_SOMENTE', '').split(',')) - {''}
for nome, vac, dias, dose in (VAC if etapa('clinico') else []):
    if nome not in animais or (SOMENTE_VAC and nome not in SOMENTE_VAC): continue
    s, c = req('POST', '/api/vacinacoes', vet, {'animalId': animais[nome], 'vacina': vac, 'dataAplicacao': d(dias), 'numeroDose': dose,
                                                 'doseQuantidade': 1.0, 'doseUnidade': 'MILILITRO', 'lote': f'L{2025 + dias % 2}-{dias:03d}', 'observacoes': None})
    if s >= 300: print('vacinacao', nome, s, str(c)[:160])
PROC = [('Thor', 'castracao', 95, 'Orquiectomia eletiva', 'Sem complicações'), ('Mel', 'atendimento_clinico', 7, 'Avaliação de rotina', 'Estável'),
        ('Luna', 'cirurgia_maior', 20, 'Osteossíntese de fêmur', 'Em recuperação'), ('Mia', 'castracao', 140, 'OSH', 'Sem complicações'),
        ('Rex', 'atendimento_clinico', 2, 'Avaliação de quarentena', 'Sem sinais clínicos'), ('Nina', 'atendimento_clinico', 25, 'Admissão', 'Desidratação leve'),
        ('Tom', 'atendimento_clinico', 29, 'Admissão', 'Lesões de pele; coletar exame'), ('Lola', 'castracao', 100, 'OSH', 'Sem complicações')]
for nome, tipo, dias, desc, res in (PROC if etapa('clinico') else []):
    if nome not in animais or SOMENTE_VAC: continue
    s, c = req('POST', '/api/procedimentos', vet2, {'animalId': animais[nome], 'tipoProcedimento': tipo, 'data': d(dias), 'descricao': desc, 'resultado': res})
    if s >= 300: print('procedimento', nome, s, str(c)[:160])
# medicamentos e prescrições ativas
if etapa('clinico') and not SOMENTE_VAC:
  cat = ok(*req('POST', '/api/categorias-farmacologicas', vet, {'nome': 'Antibiótico'}), 'categoria')
  cat2 = ok(*req('POST', '/api/categorias-farmacologicas', vet, {'nome': 'Antiparasitário'}), 'categoria 2')
  med1 = ok(*req('POST', '/api/medicamentos', vet, {'nome': 'Amoxicilina 250 mg', 'categoriaId': cat['id']}), 'medicamento 1')
  med2 = ok(*req('POST', '/api/medicamentos', vet, {'nome': 'Ivermectina 6 mg', 'categoriaId': cat2['id']}), 'medicamento 2')
  req('POST', '/api/medicamentos', vet, {'nome': 'Doxiciclina 100 mg', 'categoriaId': cat['id']})
  for nome, med, dias in [('Luna', med1, 5), ('Tom', med2, 3), ('Nina', med1, 10)]:
    if nome not in animais: continue
    s, c = req('POST', '/api/prescricoes', vet, {'animalId': animais[nome], 'medicamentoId': med['id'], 'dataInicio': d(dias), 'dataFimPrevista': (HOJE + dt.timedelta(days=7)).isoformat(),
                                                 'dataFimReal': None, 'frequenciaAplicada': 12, 'unidadeFrequencia': 'HORAS', 'doseQuantidade': 250, 'doseUnidade': 'MILIGRAMA',
                                                 'viaAdministracao': 'ORAL', 'status': 'ATIVA'})
    if s >= 300: print('prescricao', nome, s, str(c)[:160])

# ------------------------------------------------------------------ 5. ocorrências (Agente Sanitário)
OCS = [
    ('zoonose', 9, '08:40', 'Rua Santa Rita, 120', 'Centro', 'Próximo à praça', 'Cão com comportamento agressivo e salivação excessiva circulando pela rua; moradores relatam mordida em transeunte.', True, False, False, 1, 1, 'EM_ATENDIMENTO'),
    ('morcegos', 6, '14:15', 'Av. Galileu Bicudo, 455', 'Vila Padre Bento', 'Escola municipal', 'Morcego encontrado caído no pátio da escola, ainda vivo.', True, False, False, 2, None, 'EM_ATENDIMENTO'),
    ('irregular', 20, '10:05', 'Rua das Hortênsias, 88', 'Jardim Aeroporto', 'Casa com portão azul', 'Acúmulo de animais em residência, cerca de 15 cães em condições insalubres.', False, True, False, 3, 2, 'ABERTA'),
    ('agressivo', 15, '16:50', 'Rua Paula Souza, 310', 'Brasil', None, 'Dois cães soltos atacando pedestres no fim de tarde.', False, False, False, 4, None, 'ENCERRADA'),
    ('outros', 3, '09:20', 'Rua Padre Bartolomeu Tadei, 20', 'Cidade Nova', 'Terreno baldio', 'Animal morto em via pública há dois dias; mau cheiro.', False, False, True, None, None, 'ABERTA'),
    ('zoonose', 30, '11:00', 'Estrada da Água Branca, km 3', 'Pirapitingui', 'Sítio', 'Gato com lesões ulceradas no focinho; suspeita de esporotricose. Tutor pede orientação.', False, False, False, 5, None, 'ENCERRADA'),
    ('irregular', 2, '13:30', 'Rua Floriano Peixoto, 1500', 'Centro', 'Comércio', 'Criação de galinhas e porcos em área urbana, sem manejo de dejetos.', False, False, False, 6, 3, 'ABERTA'),
    ('agressivo', 1, '07:55', 'Rua Benedito Caetano, 77', 'Jardim Novo Itu', None, 'Cão de grande porte sem tutor identificado perseguindo crianças.', True, False, False, 7, None, 'ABERTA'),
]
DENUNCIANTES = {1: ('Ana Paula Ribeiro', '(11) 99876-1001', 'ana.ribeiro@exemplo.com', 'Rua Santa Rita, 130', 'Centro'),
                2: ('Marcos Vinícius Teixeira', '(11) 99876-1002', None, 'Av. Galileu Bicudo, 460', 'Vila Padre Bento'),
                3: ('Cláudia Ferreira Santos', '(11) 99876-1003', 'claudia.santos@exemplo.com', 'Rua das Hortênsias, 70', 'Jardim Aeroporto'),
                4: ('Roberto Carvalho', '(11) 99876-1004', None, 'Rua Paula Souza, 300', 'Brasil'),
                5: ('Sônia Martins', '(11) 99876-1005', 'sonia.martins@exemplo.com', 'Estrada da Água Branca, km 3', 'Pirapitingui'),
                6: ('Eduardo Gonçalves', '(11) 99876-1006', None, 'Rua Floriano Peixoto, 1480', 'Centro'),
                7: ('Patrícia Moraes', '(11) 99876-1007', 'patricia.moraes@exemplo.com', 'Rua Benedito Caetano, 80', 'Jardim Novo Itu')}
DENUNCIADOS = {1: ('José Antônio da Silva', '(11) 99876-2001', 'Rua Santa Rita, 118', 'Tutor do cão, segundo vizinhos'),
               2: ('Marlene Oliveira', None, 'Rua das Hortênsias, 88', 'Responsável pela residência'),
               3: ('Comercial Bom Preço Ltda. (fictício)', '(11) 4023-9999', 'Rua Floriano Peixoto, 1500', 'Estabelecimento comercial')}
ocorrencias = []
if not etapa('ocorrencias'):
    lista = sorted(ok(*req('GET', '/api/ocorrencias?tamanho=100', agente), 'listar ocorrencias')['itens'], key=lambda o: o['protocolo'])
    ocorrencias = [(o['id'], i + 1, None) for i, o in enumerate(lista)]
for idx, (tipo, dias, hora, end, bairro, ref, desc, urg, sig, anon, den, dend, status_final) in enumerate(OCS if etapa('ocorrencias') else [], 1):
    corpo = {'tipoOcorrencia': tipo, 'dataAbertura': d(dias), 'horaAbertura': hora, 'endereco': end, 'bairro': bairro, 'pontoReferencia': ref,
             'descricao': desc, 'urgente': urg, 'sigilosa': sig, 'anonima': anon, 'latitude': -23.2645 + idx * 0.004, 'longitude': -47.2992 - idx * 0.003,
             'denunciante': None, 'denunciado': None}
    if den:
        n, tel, em, e, b = DENUNCIANTES[den]
        corpo['denunciante'] = {'nome': n, 'cpf': cpf_valido(den), 'telefone': tel, 'email': em, 'cep': '13300-000', 'endereco': e, 'bairroResidencial': b}
    if dend:
        n, tel, e, obs = DENUNCIADOS[dend]
        corpo['denunciado'] = {'nome': n, 'cpf': cpf_valido(100 + dend) if dend != 3 else None, 'telefone': tel, 'endereco': e, 'observacoes': obs}
    s, c = req('POST', '/api/ocorrencias', agente if idx % 2 else agente2, corpo)
    if s >= 300:
        print('ocorrencia', idx, s, str(c)[:200]); continue
    oid = c['id']; ocorrencias.append((oid, idx, status_final))
    tok = agente if idx % 2 else agente2
    if status_final in ('EM_ATENDIMENTO', 'ENCERRADA'):
        req('PATCH', f'/api/ocorrencias/{oid}/status', tok, {'status': 'EM_ATENDIMENTO'})
        req('POST', f'/api/ocorrencias/{oid}/notas', tok, {'descricao': 'Equipe deslocada ao local; primeira vistoria realizada.'})
    if idx in (1, 3):
        req('POST', f'/api/ocorrencias/{oid}/anexos', tok, multipart=('arquivo', f'foto-local-{idx}.png', 'image/png', png_minusculo()))
    if status_final == 'ENCERRADA':
        prov = 'captura_remocao' if idx == 4 else 'orientacao_municipe'
        s2, c2 = req('POST', f'/api/ocorrencias/{oid}/encerramento', tok, {'providenciaTomada': prov, 'descricaoEncerramento': 'Atendimento concluído; munícipe orientado e situação resolvida.'})
        if s2 >= 300: print('encerramento', idx, s2, str(c2)[:160])
print('ocorrencias', len(ocorrencias))

# ------------------------------------------------------------------ 6. processos sanitários (um urgente, resultados variados)
def responsavel(i):
    nomes = ['Helena Castro', 'Antônio Barbosa', 'Juliana Prado', 'Sérgio Mendes', 'Beatriz Rocha', 'Luiz Henrique Dias']
    return {'nome': nomes[i % len(nomes)], 'cpf': cpf_valido(500 + i), 'telefone': f'(11) 99777-10{i:02d}', 'email': f'municipe{i}@exemplo.com',
            'cep': '13300-000', 'endereco': f'Rua Fictícia, {100 + i}', 'bairroResidencial': ['Centro', 'Brasil', 'Cidade Nova', 'Pirapitingui'][i % 4],
            'bairroOcorrencia': ['Centro', 'Brasil', 'Cidade Nova', 'Pirapitingui'][i % 4]}
def amostra(esp, contato, animal_id=None, sintomas=('alt_comportamental', 'salivacao_excessiva'), material='TECIDO_ENCEFALICO', status='OBITO'):
    # animal do canil: identificacao vem da ficha; sintomas so em amostra sintomatica (regras do ProcessoSanitarioService)
    ident = {} if animal_id else {'especie': esp, 'sexo': 'macho', 'raca': 'SRD', 'coloracao': 'Caramelo', 'pelagem': 'curta', 'idadeAprox': '3 anos', 'pesoKg': 14.0}
    base = {'animalId': animal_id, 'statusClinico': status, 'tipoAbrigo': 'PERIDOMICILIAR', 'alteracaoComportamental': 'Agressividade súbita' if contato else None, 'dataColeta': d(2),
            'materialBiologico': material, 'contatoHumano': contato, 'nivelContato': 'DIRETA' if contato else None, 'agrediuHumano': True if contato else None,
            'observacoes': None, 'sintomas': list(sintomas) if status == 'SINTOMATICO' else []}
    base.update(ident)
    return base
oc_ids = {idx: oid for oid, idx, _ in ocorrencias}
PROCS = [
    ('raiva', 'pasteur_sp', oc_ids.get(1), True, 'canino', 9, 'AGUARDANDO_RESULTADO', None),          # urgente, vinculado à ocorrência 1
    ('raiva', 'pasteur_sp', oc_ids.get(2), True, 'quiroptero', 6, 'COM_RESULTADO', 'negativo'),
    ('esporotricose', 'ial_sorocaba', None, False, 'felino', 28, 'CONCLUIDO', 'positivo'),  # ocorrência 6 já encerrada: sem vínculo
    ('leishmaniose_visceral', 'ccz_sp', None, False, 'canino', 40, 'COM_RESULTADO', 'inconclusivo'),
    ('leptospirose', 'itu_ll01', None, False, 'canino', 15, 'ABERTO', None),
    ('raiva', 'pasteur_sp', None, False, 'canino', 60, 'CONCLUIDO', 'negativo'),
]
SOMENTE_PROCS = set(os.environ.get('PROCS_SOMENTE', '').split(',')) - {''}
for i, (doenca, lab, oc, contato, esp, dias, status_final, resultado) in enumerate(PROCS if etapa('processos') else [], 1):
    if SOMENTE_PROCS and str(i) not in SOMENTE_PROCS: continue
    amostras = [amostra(esp, contato, status='SINTOMATICO' if contato else 'OBITO')]
    if i == 1: amostras.append(amostra('canino', False, animais.get('Zeus'), ('alt_comportamental',), 'SALIVA', 'SINTOMATICO'))
    corpo = {'dataAbertura': d(dias), 'doenca': doenca, 'laboratorio': lab, 'ocorrenciaId': oc, 'responsavel': responsavel(i), 'amostras': amostras,
             'observacoes': 'Amostra encaminhada ao laboratório de referência.' if i % 2 else None}
    s, c = req('POST', '/api/processos', agente, corpo)
    if s >= 300:
        print('processo', i, s, str(c)[:300]); continue
    pid = c['id']
    if status_final != 'ABERTO':
        req('PATCH', f'/api/processos/{pid}/status', agente, {'status': 'AGUARDANDO_RESULTADO'})
    if resultado:
        s2, c2 = req('POST', f'/api/processos/{pid}/resultados', vet, {'resultado': resultado, 'dataResultado': d(max(dias - 10, 1)), 'observacoes': None,
                                                                           'desfechoAnimal': 'obito_natural' if resultado != 'inconclusivo' else 'em_acompanhamento'})
        if s2 >= 300: print('resultado', i, s2, str(c2)[:160])
    if status_final == 'CONCLUIDO':
        req('PATCH', f'/api/processos/{pid}/status', agente, {'status': 'CONCLUIDO'})
print('processos', len(PROCS))

# ------------------------------------------------------------------ 7. relatórios (histórico de exportações)
for tipo, extra in ([('anual_processos', {'ano': HOJE.year}), ('vacinacao', {'periodoInicio': d(365), 'periodoFim': d(0)}),
                    ('ocupacao_baias', {'janela': 'ultimos_6_meses'}), ('ocorrencias_bairro', {'periodoInicio': d(90), 'periodoFim': d(0)})] if etapa('relatorios') else []):
    for formato in ('pdf', 'csv'):
        body = {'tipo': tipo, 'formato': formato, 'periodoInicio': None, 'periodoFim': None, 'ano': None, 'janela': None}; body.update(extra)
        r = urllib.request.Request(API + '/api/relatorios/exportar', data=json.dumps(body).encode(), method='POST',
                                   headers={'Authorization': 'Bearer ' + admin_tok, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(r, timeout=120) as resp: print('relatorio', tipo, formato, resp.status)
        except urllib.error.HTTPError as e: print('relatorio', tipo, formato, e.code, e.read()[:120])
# ------------------------------------------------------------------ 8. exames e anexos do animal (RF-A04, F2-007)
if etapa('exames'):
    EXAMES = [('Thor', 'hemograma', 'ial_sorocaba', 30, 25, 'Hemograma sem alterações dignas de nota.'), ('Thor', 'sorologia', 'pasteur_sp', 10, None, None),
              ('Luna', 'radiografia', None, 20, 20, 'Fratura de fêmur consolidando; sem desvio.'), ('Tom', 'raspado_pele', 'ial_sorocaba', 28, 21, 'Negativo para Sporothrix; dermatofitose compatível.'),
              ('Nina', 'bioquimico', 'ial_sorocaba', 24, 20, 'Ureia e creatinina dentro da referência.')]
    for nome, tipo, lab, d_sol, d_res, resultado in EXAMES:
        if nome not in animais: continue
        s_, c_ = req('POST', '/api/exames', vet, {'animalId': animais[nome], 'tipoExame': tipo, 'laboratorio': lab, 'dataSolicitacao': d(d_sol),
                                                  'dataResultado': d(d_res) if d_res is not None else None, 'resultado': resultado, 'observacoes': None})
        if s_ >= 300: print('exame', nome, s_, str(c_)[:160])
    for nome, arq, desc in [('Thor', 'foto-entrada-thor.png', 'Foto na entrada'), ('Thor', 'laudo-hemograma.png', 'Laudo digitalizado (hemograma)'), ('Luna', 'raio-x-femur.png', 'Radiografia do fêmur')]:
        if nome not in animais: continue
        s_, c_ = req('POST', f"/api/animais/{animais[nome]}/anexos", vet, multipart=('arquivo', arq, 'image/png', png_minusculo()))
        if s_ >= 300: print('anexo', nome, s_, str(c_)[:160])
    print('exames e anexos ok')
print('SEED DEMO CONCLUÍDO —', HOJE.isoformat())
