# -*- coding: utf-8 -*-
"""Fase 3 — kit de edição OOXML do TG (somente stdlib).

Opera sobre o XML do .docx preservando estilos: toda alteração de texto é gravada
como CONTROLE DE ALTERAÇÕES do Word (w:del + w:ins, autor "Revisão SISZOO").
Operações:
  - substituir_paragrafo(trecho_antigo, texto_novo, ocorrencia=1)
  - inserir_paragrafo_apos(trecho_ancora, texto_novo, ocorrencia=1)
  - inserir_figura(placeholder, caminho_png, legenda_esperada)
  - inserir_linha_tabela_apos(trecho_linha_ancora, [celulas])
  - marcar_update_fields()
Registra cada mudança em self.log (lista de dicts) para o log_alteracoes_documento.md.
"""
import re, struct, zipfile, html, datetime
from xml.sax.saxutils import escape

AUTOR = 'Revisão SISZOO'
DATA = '2026-10-22T18:00:00Z'
EMU_POR_PX = 9525            # 96 dpi
LARGURA_MAX_EMU = 5760000    # 16 cm (largura útil A4 ABNT)
ALTURA_MAX_EMU = 7200000     # 20 cm (deixa espaço para legenda e fonte na mesma página)
W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'

def _esc(t):
    return escape(t, {'"': '&quot;'})

def _texto_do_paragrafo(xml_p):
    return ''.join(html.unescape(t) for t in re.findall(r'<w:t(?:\s[^>]*)?>([^<]*)</w:t>', xml_p))

class DocxKit:
    def __init__(self, caminho_origem):
        self.origem = caminho_origem
        z = zipfile.ZipFile(caminho_origem)
        self.partes = {n: z.read(n) for n in z.namelist()}
        self.ordem = z.namelist()
        z.close()
        self.doc = self.partes['word/document.xml'].decode('utf-8')
        self.rels = self.partes['word/_rels/document.xml.rels'].decode('utf-8')
        self.proximo_id = 9000
        self.proximo_rid = max(int(x) for x in re.findall(r'Id="rId(\d+)"', self.rels)) + 1
        self.proximo_docpr = 900
        self.log = []
        self.midias_novas = {}

    # ------------------------------------------------------------ utilidades
    def _novo_id(self):
        self.proximo_id += 1
        return self.proximo_id

    def _marca(self, tipo):
        return f'w:id="{self._novo_id()}" w:author="{AUTOR}" w:date="{DATA}"'

    def pos_legenda(self, prefixo, ocorrencia=2):
        """Fim do parágrafo (ocorrência N) cujo texto começa com `prefixo` (legendas: a 1ª ocorrência é a lista pré-textual)."""
        pos, n = 0, 0
        padrao = re.compile(r'<w:p[ >]')
        while True:
            m = padrao.search(self.doc, pos)
            if not m:
                raise ValueError(f'Legenda não encontrada: {prefixo!r}')
            fim_tag = self.doc.find('>', m.start())
            if self.doc[fim_tag - 1] == '/':
                pos = fim_tag + 1
                continue
            fim = self.doc.find('</w:p>', m.start()) + len('</w:p>')
            if _texto_do_paragrafo(self.doc[m.start():fim]).startswith(prefixo):
                n += 1
                if n == ocorrencia:
                    return fim
            pos = fim

    def _achar_paragrafo(self, trecho, ocorrencia=1, apos=0, exato=False):
        """Retorna (inicio, fim) do <w:p> cujo texto concatenado contém `trecho` (ou é igual a ele, se exato), a partir de `apos`."""
        pos = apos
        encontrados = 0
        padrao = re.compile(r'<w:p[ >]')
        while True:
            m = padrao.search(self.doc, pos)
            if not m:
                raise ValueError(f'Parágrafo não encontrado: {trecho[:80]!r} (ocorrência {ocorrencia})')
            ini = m.start()
            fim_tag = self.doc.find('>', ini)
            if self.doc[fim_tag - 1] == '/':      # <w:p .../> vazio
                pos = fim_tag + 1
                continue
            fim = self.doc.find('</w:p>', ini) + len('</w:p>')
            xml_p = self.doc[ini:fim]
            texto = _texto_do_paragrafo(xml_p)
            if (texto.strip() == trecho.strip()) if exato else (trecho in texto):
                encontrados += 1
                if encontrados == ocorrencia:
                    return ini, fim
            pos = fim

    def _fim_da_tabela(self, tbl_ini):
        """Índice logo após o </w:tbl> que fecha a tabela iniciada em tbl_ini (tabelas podem ser aninhadas)."""
        prof = 0
        for m in re.finditer(r'<w:tbl>|</w:tbl>', self.doc[tbl_ini:]):
            prof += 1 if m.group(0) == '<w:tbl>' else -1
            if prof == 0:
                return tbl_ini + m.end()
        raise ValueError('tabela sem fechamento')

    @staticmethod
    def _ppr_e_runs(xml_p):
        m = re.match(r'(<w:p(?:\s[^>]*)?>)(<w:pPr>.*?</w:pPr>)?(.*)</w:p>$', xml_p, flags=re.S)
        abertura, ppr, corpo = m.group(1), m.group(2) or '', m.group(3)
        return abertura, ppr, corpo

    @staticmethod
    def _primeiro_rpr(corpo):
        m = re.search(r'<w:r>(<w:rPr>.*?</w:rPr>)', corpo, flags=re.S) or re.search(r'<w:r\s[^>]*>(<w:rPr>.*?</w:rPr>)', corpo, flags=re.S)
        return m.group(1) if m else ''

    @staticmethod
    def _para_deltext(corpo):
        corpo = re.sub(r'<w:t(\s[^>]*)?>', lambda m: '<w:delText xml:space="preserve">', corpo)
        return corpo.replace('</w:t>', '</w:delText>')

    def _run_novo(self, rpr, texto):
        return f'<w:r>{rpr}<w:t xml:space="preserve">{_esc(texto)}</w:t></w:r>'

    # ------------------------------------------------------------ operações
    def substituir_paragrafo(self, trecho_antigo, texto_novo, ocorrencia=1, local='', id_item='', apos=0, exato=False):
        ini, fim = self._achar_paragrafo(trecho_antigo, ocorrencia, apos, exato)
        xml_p = self.doc[ini:fim]
        abertura, ppr, corpo = self._ppr_e_runs(xml_p)
        antigo = _texto_do_paragrafo(xml_p)
        rpr = self._primeiro_rpr(corpo)
        # runs existentes viram exclusão controlada; texto novo entra como inserção
        runs_del = f'<w:del {self._marca("del")}>{self._para_deltext(corpo)}</w:del>' if corpo.strip() else ''
        run_ins = f'<w:ins {self._marca("ins")}>{self._run_novo(rpr, texto_novo)}</w:ins>'
        novo = f'{abertura}{ppr}{runs_del}{run_ins}</w:p>'
        self.doc = self.doc[:ini] + novo + self.doc[fim:]
        self.log.append({'op': 'substituir', 'local': local, 'id': id_item, 'antes': antigo, 'depois': texto_novo, 'controlado': True})
        return antigo

    def inserir_paragrafo_apos(self, trecho_ancora, texto_novo, ocorrencia=1, local='', id_item='', copiar_ppr=True, apos_tabela_seguinte=False):
        ini, fim = self._achar_paragrafo(trecho_ancora, ocorrencia)
        xml_p = self.doc[ini:fim]
        abertura, ppr, corpo = self._ppr_e_runs(xml_p)
        rpr = self._primeiro_rpr(corpo)
        ponto = fim
        if apos_tabela_seguinte:
            prox_tbl = self.doc.find('<w:tbl>', fim)
            if prox_tbl != -1 and prox_tbl - fim < 200:
                ponto = self.doc.find('</w:tbl>', prox_tbl) + len('</w:tbl>')
        ppr_novo = ppr if copiar_ppr else ''
        marca_par = f'<w:rPr><w:ins {self._marca("ins")}/></w:rPr>'
        if ppr_novo:
            if '<w:rPr>' in ppr_novo:
                ppr_novo = re.sub(r'<w:rPr>', f'<w:rPr><w:ins {self._marca("ins")}/>', ppr_novo, count=1)
            else:
                ppr_novo = ppr_novo.replace('</w:pPr>', marca_par + '</w:pPr>')
        else:
            ppr_novo = f'<w:pPr>{marca_par}</w:pPr>'
        novo = f'<w:p>{ppr_novo}<w:ins {self._marca("ins")}>{self._run_novo(rpr, texto_novo)}</w:ins></w:p>'
        self.doc = self.doc[:ponto] + novo + self.doc[ponto:]
        self.log.append({'op': 'inserir_paragrafo', 'local': local, 'id': id_item, 'antes': f'(após: {_texto_do_paragrafo(xml_p)[:90]})', 'depois': texto_novo, 'controlado': True})

    def substituir_run(self, trecho_antigo, texto_novo, ocorrencia=1, local='', id_item='', apos=0, exato=False):
        """Substitui só o run cujo texto contém o trecho (preserva tabulações e números de página do parágrafo)."""
        ini, fim = self._achar_paragrafo(trecho_antigo, ocorrencia, apos, exato)
        xml_p = self.doc[ini:fim]
        novo_p = None
        for m in re.finditer(r'<w:r>(?:(?!</w:r>).)*?</w:r>|<w:r\s[^>]*>(?:(?!</w:r>).)*?</w:r>', xml_p, flags=re.S):
            run = m.group(0)
            if trecho_antigo in _texto_do_paragrafo(run):
                rpr = re.search(r'<w:rPr>.*?</w:rPr>', run, flags=re.S)
                rpr = rpr.group(0) if rpr else ''
                antigo = _texto_do_paragrafo(run)
                novo_run = (f'<w:del {self._marca("del")}>{self._para_deltext(run)}</w:del>'
                            f'<w:ins {self._marca("ins")}>{self._run_novo(rpr, texto_novo)}</w:ins>')
                novo_p = xml_p[:m.start()] + novo_run + xml_p[m.end():]
                break
        if novo_p is None:
            raise ValueError(f'Run não encontrado: {trecho_antigo[:60]!r}')
        self.doc = self.doc[:ini] + novo_p + self.doc[fim:]
        self.log.append({'op': 'substituir_run', 'local': local, 'id': id_item, 'antes': antigo, 'depois': texto_novo, 'controlado': True})

    def inserir_nota_apos_quadro(self, legenda_quadro, texto, modelo_ppr_trecho, local='', id_item=''):
        """Insere um parágrafo de corpo depois da linha 'Fonte:' que segue a tabela do quadro (legenda = 2ª ocorrência, a 1ª é a Lista de Quadros)."""
        ini, fim = self._achar_paragrafo(legenda_quadro, 2)
        pos = fim
        # pode haver mais de uma tabela em sequência (Quadro 13 fragmentado)
        while True:
            prox_tbl = self.doc.find('<w:tbl>', pos)
            prox_p = self.doc.find('<w:p', pos)
            if prox_tbl != -1 and (prox_p == -1 or prox_tbl < prox_p):
                pos = self._fim_da_tabela(prox_tbl)
            else:
                break
        p_fonte_fim = self.doc.find('</w:p>', pos) + len('</w:p>')
        assert 'Fonte:' in _texto_do_paragrafo(self.doc[pos:p_fonte_fim]), legenda_quadro
        mi, mf = self._achar_paragrafo(modelo_ppr_trecho)
        _, ppr, corpo = self._ppr_e_runs(self.doc[mi:mf])
        rpr = self._primeiro_rpr(corpo)
        marca_par = f'<w:ins {self._marca("ins")}/>'
        ppr_novo = (ppr.replace('<w:rPr>', '<w:rPr>' + marca_par, 1) if '<w:rPr>' in ppr
                    else ppr.replace('</w:pPr>', f'<w:rPr>{marca_par}</w:rPr></w:pPr>'))
        novo = f'<w:p>{ppr_novo}<w:ins {self._marca("ins")}>{self._run_novo(rpr, texto)}</w:ins></w:p>'
        self.doc = self.doc[:p_fonte_fim] + novo + self.doc[p_fonte_fim:]
        self.log.append({'op': 'inserir_nota', 'local': local or legenda_quadro, 'id': id_item, 'antes': '(novo parágrafo após a fonte do quadro)', 'depois': texto, 'controlado': True})

    def inserir_linha_tabela_apos(self, trecho_linha_ancora, celulas, ocorrencia=1, local='', id_item='', apos=0, exato=False):
        """Clona a linha (<w:tr>) cujo parágrafo contém o trecho e insere uma nova logo após, com os textos dados."""
        pos, _ = self._achar_paragrafo(trecho_linha_ancora, ocorrencia, apos, exato)
        tr_ini = max(self.doc.rfind('<w:tr ', 0, pos), self.doc.rfind('<w:tr>', 0, pos))
        if tr_ini == -1:
            raise ValueError(f'Linha não encontrada: {trecho_linha_ancora[:60]!r}')
        tr_fim = self.doc.find('</w:tr>', pos) + len('</w:tr>')
        linha = self.doc[tr_ini:tr_fim]
        celulas_xml = re.findall(r'<w:tc>.*?</w:tc>', linha, flags=re.S)
        if len(celulas_xml) != len(celulas):
            raise ValueError(f'Linha tem {len(celulas_xml)} células, recebi {len(celulas)} textos')
        nova = linha
        rpr_linha = self._primeiro_rpr(linha)
        for cx, texto in zip(celulas_xml, celulas):
            abertura_tc = re.match(r'(<w:tc>(?:<w:tcPr>.*?</w:tcPr>)?)', cx, flags=re.S).group(1)
            if '<w:p' not in cx[len(abertura_tc):len(abertura_tc) + 3]:
                abertura_tc = cx[:cx.find('<w:p')]
            p_match = re.search(r'<w:p(?:\s[^>]*)?>(<w:pPr>.*?</w:pPr>)?(.*?)</w:p>', cx, flags=re.S)
            if p_match:
                ppr = p_match.group(1) or ''
                rpr = self._primeiro_rpr(p_match.group(2) or '') or rpr_linha
            else:                                  # célula com <w:p .../> vazio
                ppr, rpr = '', rpr_linha
            marca_par = f'<w:ins {self._marca("ins")}/>'
            if ppr and '<w:rPr>' in ppr:
                ppr2 = ppr.replace('<w:rPr>', '<w:rPr>' + marca_par, 1)
            elif ppr:
                ppr2 = ppr.replace('</w:pPr>', f'<w:rPr>{marca_par}</w:rPr></w:pPr>')
            else:
                ppr2 = f'<w:pPr><w:rPr>{marca_par}</w:rPr></w:pPr>'
            novo_tc = f'{abertura_tc}<w:p>{ppr2}<w:ins {self._marca("ins")}>{self._run_novo(rpr, texto)}</w:ins></w:p></w:tc>'
            nova = nova.replace(cx, novo_tc, 1)
        # marca a linha como inserida
        nova = re.sub(r'^<w:tr(\s[^>]*)?>', lambda m: '<w:tr>', nova, count=1)
        nova = re.sub(r'<w:p w14:paraId="[^"]*"', '<w:p', nova)   # paraIds duplicados não são permitidos
        if '<w:trPr>' in nova:
            nova = nova.replace('<w:trPr>', f'<w:trPr><w:ins {self._marca("ins")}/>', 1)
        else:
            nova = re.sub(r'(</w:tblPrEx>)', lambda m: m.group(1) + f'<w:trPr><w:ins {self._marca("ins")}/></w:trPr>', nova, count=1) if '</w:tblPrEx>' in nova else nova.replace('<w:tr>', f'<w:tr><w:trPr><w:ins {self._marca("ins")}/></w:trPr>', 1)
        self.doc = self.doc[:tr_fim] + nova + self.doc[tr_fim:]
        self.log.append({'op': 'inserir_linha', 'local': local, 'id': id_item, 'antes': f'(após a linha: {trecho_linha_ancora[:60]})', 'depois': ' | '.join(celulas), 'controlado': True})

    # ------------------------------------------------------------ figuras
    _TBL_FIGURA = ('<w:tbl><w:tblPr><w:tblStyle w:val="28"/><w:tblW w:w="8971" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders>'
                   '<w:top w:val="none" w:color="auto" w:sz="0" w:space="0"/><w:left w:val="none" w:color="auto" w:sz="0" w:space="0"/>'
                   '<w:bottom w:val="none" w:color="auto" w:sz="0" w:space="0"/><w:right w:val="none" w:color="auto" w:sz="0" w:space="0"/>'
                   '<w:insideH w:val="none" w:color="auto" w:sz="0" w:space="0"/><w:insideV w:val="none" w:color="auto" w:sz="0" w:space="0"/></w:tblBorders>'
                   '<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="10" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/>'
                   '<w:right w:w="10" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="8971"/></w:tblGrid>'
                   '<w:tr><w:trPr><w:ins {MARCA_TR}/><w:jc w:val="center"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="8971" w:type="dxa"/>'
                   '<w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders>'
                   '<w:tcMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tcMar></w:tcPr>'
                   '<w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:ins {MARCA_P}/></w:rPr></w:pPr><w:ins {MARCA_R}><w:r><w:drawing>'
                   '<wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{CX}" cy="{CY}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
                   '<wp:docPr id="{DOCPR}" name="{NOME}"/><wp:cNvGraphicFramePr/>'
                   '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
                   '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="{DOCPR}" name="{NOME}"/>'
                   '<pic:cNvPicPr preferRelativeResize="0"/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{RID}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
                   '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{CX}" cy="{CY}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>'
                   '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:ins></w:p></w:tc></w:tr></w:tbl>')

    @staticmethod
    def _dimensoes_png(caminho):
        with open(caminho, 'rb') as f:
            cab = f.read(24)
        if cab[:8] != b'\x89PNG\r\n\x1a\n':
            raise ValueError('Não é PNG: ' + caminho)
        largura, altura = struct.unpack('>II', cab[16:24])
        return largura, altura

    def inserir_figura(self, placeholder, caminho_png, local='', id_item='', nome_midia=None):
        """Substitui o parágrafo placeholder pela tabela-figura (padrão do documento) com a imagem."""
        ini, fim = self._achar_paragrafo(placeholder)
        xml_p = self.doc[ini:fim]
        abertura, ppr, corpo = self._ppr_e_runs(xml_p)
        # 1) placeholder: texto e marca de parágrafo excluídos (controlado)
        marca_par_del = f'<w:rPr><w:del {self._marca("del")}/></w:rPr>'
        ppr_del = (re.sub(r'<w:rPr>', f'<w:rPr><w:del {self._marca("del")}/>', ppr, count=1) if '<w:rPr>' in ppr
                   else (ppr.replace('</w:pPr>', marca_par_del + '</w:pPr>') if ppr else f'<w:pPr>{marca_par_del}</w:pPr>'))
        p_del = f'{abertura}{ppr_del}<w:del {self._marca("del")}>{self._para_deltext(corpo)}</w:del></w:p>'
        # 2) imagem: parte de mídia + relacionamento
        largura_px, altura_px = self._dimensoes_png(caminho_png)
        cx = min(LARGURA_MAX_EMU, largura_px * EMU_POR_PX)
        cy = int(cx * altura_px / largura_px)
        if cy > ALTURA_MAX_EMU:
            cy = ALTURA_MAX_EMU
            cx = int(cy * largura_px / altura_px)
        nome = nome_midia or ('fase3_' + re.sub(r'[^A-Za-z0-9_]', '_', placeholder.split('TELA ')[-1].split(' ')[0]) + '.png')
        destino = 'word/media/' + nome
        with open(caminho_png, 'rb') as f:
            self.partes[destino] = f.read()
        if destino not in self.ordem:
            self.ordem.append(destino)
        rid = f'rId{self.proximo_rid}'; self.proximo_rid += 1
        self.rels = self.rels.replace('</Relationships>',
            f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/{nome}"/></Relationships>')
        self.proximo_docpr += 1
        tbl = (self._TBL_FIGURA.replace('{MARCA_TR}', self._marca('ins')).replace('{MARCA_P}', self._marca('ins')).replace('{MARCA_R}', self._marca('ins'))
               .replace('{CX}', str(cx)).replace('{CY}', str(cy)).replace('{DOCPR}', str(self.proximo_docpr)).replace('{NOME}', nome).replace('{RID}', rid))
        self.doc = self.doc[:ini] + p_del + tbl + self.doc[fim:]
        self.log.append({'op': 'inserir_figura', 'local': local, 'id': id_item, 'antes': _texto_do_paragrafo(xml_p),
                         'depois': f'imagem {nome} ({largura_px}×{altura_px} px; {cx/360000:.1f} × {cy/360000:.1f} cm)', 'controlado': True})
        self.midias_novas[nome] = caminho_png

    # ------------------------------------------------------------ settings / salvar
    def marcar_update_fields(self):
        st = self.partes['word/settings.xml'].decode('utf-8')
        if 'w:updateFields' not in st:
            st = re.sub(r'(<w:settings[^>]*>)', lambda m: m.group(1) + '<w:updateFields w:val="true"/>', st, count=1)
            self.partes['word/settings.xml'] = st.encode('utf-8')
            self.log.append({'op': 'settings', 'local': 'word/settings.xml', 'id': 'F1-051/F1-052', 'antes': '', 'depois': 'w:updateFields=true (Word pede para atualizar Sumário/Listas ao abrir)', 'controlado': False})

    def texto_contem(self, trecho):
        return trecho in _texto_do_paragrafo(self.doc)

    def salvar(self, destino):
        self.partes['word/document.xml'] = self.doc.encode('utf-8')
        self.partes['word/_rels/document.xml.rels'] = self.rels.encode('utf-8')
        ct = self.partes['[Content_Types].xml'].decode('utf-8')
        if 'Extension="png"' not in ct:
            ct = ct.replace('</Types>', '<Default Extension="png" ContentType="image/png"/></Types>')
            self.partes['[Content_Types].xml'] = ct.encode('utf-8')
        with zipfile.ZipFile(destino, 'w', zipfile.ZIP_DEFLATED) as z:
            for n in self.ordem:
                if n.endswith('/'):
                    continue
                z.writestr(n, self.partes[n])
        return destino
