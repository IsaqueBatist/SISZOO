# -*- coding: utf-8 -*-
"""Fase 4 — operações OOXML SEM controle de alterações, sobre o documento já aceito.

Estende DocxKit (docx_kit.py) com: substituição de mídia, remoção de intervalos, legendas com campo SEQ,
listas automáticas (TOC \\c), seção pré-textual sem número de página, cabeçalho com PAGE, estilos ABNT.
"""
import os, re, struct, html
from docx_kit import DocxKit, _texto_do_paragrafo, _esc, EMU_POR_PX, LARGURA_MAX_EMU, ALTURA_MAX_EMU

NS_W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
NS_R = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
NS_W14 = 'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"'


class DocxFinal(DocxKit):

    # ------------------------------------------------------------ parágrafos
    def paragrafos(self, apos=0, ate=None):
        """Gera (ini, fim, xml) de cada <w:p> (não auto-fechado) entre apos e ate."""
        pos = apos
        limite = ate if ate is not None else len(self.doc)
        padrao = re.compile(r'<w:p[ >]')
        while True:
            m = padrao.search(self.doc, pos)
            if not m or m.start() >= limite:
                return
            fim_tag = self.doc.find('>', m.start())
            if self.doc[fim_tag - 1] == '/':
                pos = fim_tag + 1
                continue
            fim = self.doc.find('</w:p>', m.start()) + len('</w:p>')
            yield m.start(), fim, self.doc[m.start():fim]
            pos = fim

    def texto(self, xml_p):
        return _texto_do_paragrafo(xml_p)

    def pos_texto(self, trecho, ocorrencia=1, apos=0, exato=False):
        return self._achar_paragrafo(trecho, ocorrencia, apos, exato)

    def _em_tabela(self, pos):
        """True se a posição está dentro de uma <w:tbl> (conta aberturas/fechamentos antes de pos)."""
        trecho = self.doc[:pos]
        return trecho.count('<w:tbl>') > trecho.count('</w:tbl>')

    def substituir_texto(self, trecho, novo, ocorrencia=1, apos=0, exato=False, local='', id_item=''):
        """Troca o texto do parágrafo inteiro (sem rastreio), mantendo pPr e o rPr do primeiro run."""
        ini, fim = self._achar_paragrafo(trecho, ocorrencia, apos, exato)
        xml_p = self.doc[ini:fim]
        abertura, ppr, corpo = self._ppr_e_runs(xml_p)
        rpr = self._primeiro_rpr(corpo)
        extras = ''.join(re.findall(r'<w:bookmark(?:Start|End)[^>]*/>', corpo))
        novo_p = f'{abertura}{ppr}{extras}{self._run_novo(rpr, novo)}</w:p>'
        self.doc = self.doc[:ini] + novo_p + self.doc[fim:]
        self.log.append({'op': 'texto', 'local': local, 'id': id_item, 'antes': self.texto(xml_p)[:200], 'depois': novo[:200], 'controlado': False})

    def inserir_paragrafo_depois(self, trecho, texto, ppr_xml, rpr_xml='', ocorrencia=1, apos=0, exato=False, local='', id_item=''):
        ini, fim = self._achar_paragrafo(trecho, ocorrencia, apos, exato)
        novo = f'<w:p>{ppr_xml}{self._run_novo(rpr_xml, texto)}</w:p>'
        self.doc = self.doc[:fim] + novo + self.doc[fim:]
        self.log.append({'op': 'inserir', 'local': local, 'id': id_item, 'antes': '', 'depois': texto[:200], 'controlado': False})
        return fim, fim + len(novo)

    def remover_paragrafo(self, trecho, ocorrencia=1, apos=0, exato=False, local='', id_item=''):
        ini, fim = self._achar_paragrafo(trecho, ocorrencia, apos, exato)
        assert '<w:sectPr' not in self.doc[ini:fim], 'parágrafo com sectPr não pode ser removido'
        removido = self.texto(self.doc[ini:fim])
        self.doc = self.doc[:ini] + self.doc[fim:]
        self.log.append({'op': 'remover', 'local': local, 'id': id_item, 'antes': removido[:200], 'depois': '', 'controlado': False})

    def definir_ppr(self, ini, fim, novo_ppr):
        """Substitui o <w:pPr> do parágrafo [ini,fim) preservando um eventual <w:sectPr> interno."""
        xml_p = self.doc[ini:fim]
        abertura, ppr, corpo = self._ppr_e_runs(xml_p)
        sect = re.search(r'<w:sectPr.*?</w:sectPr>', ppr, flags=re.S)
        if sect:
            novo_ppr = novo_ppr.replace('</w:pPr>', sect.group(0) + '</w:pPr>')
        novo_p = f'{abertura}{novo_ppr}{corpo}</w:p>'
        self.doc = self.doc[:ini] + novo_p + self.doc[fim:]
        return ini, ini + len(novo_p)

    # ------------------------------------------------------------ mídia
    def substituir_midia(self, nome_docpr, caminho_png, local='', id_item=''):
        """Troca a imagem cujo wp:docPr/pic:cNvPr tem name=nome_docpr e recalcula as dimensões."""
        m = re.search(r'<wp:docPr [^>]*name="' + re.escape(nome_docpr) + r'"', self.doc)
        if not m:
            raise ValueError('docPr não encontrado: ' + nome_docpr)
        ini_inline = self.doc.rfind('<wp:inline', 0, m.start())
        fim_inline = self.doc.find('</wp:inline>', m.start()) + len('</wp:inline>')
        inline = self.doc[ini_inline:fim_inline]
        rid = re.search(r'r:embed="(rId\d+)"', inline).group(1)
        alvo = re.search(r'Id="' + rid + r'"[^>]*Target="([^"]+)"', self.rels) or re.search(r'Target="([^"]+)"[^>]*Id="' + rid + r'"', self.rels)
        parte = 'word/' + alvo.group(1).lstrip('/')
        with open(caminho_png, 'rb') as f:
            self.partes[parte] = f.read()
        largura_px, altura_px = self._dimensoes_png(caminho_png)
        cx = min(LARGURA_MAX_EMU, largura_px * EMU_POR_PX)
        cy = int(cx * altura_px / largura_px)
        if cy > ALTURA_MAX_EMU:
            cy = ALTURA_MAX_EMU
            cx = int(cy * largura_px / altura_px)
        inline_novo = re.sub(r'<wp:extent cx="\d+" cy="\d+"/>', f'<wp:extent cx="{cx}" cy="{cy}"/>', inline)
        inline_novo = re.sub(r'<a:ext cx="\d+" cy="\d+"/>', f'<a:ext cx="{cx}" cy="{cy}"/>', inline_novo)
        self.doc = self.doc[:ini_inline] + inline_novo + self.doc[fim_inline:]
        self.log.append({'op': 'midia', 'local': local, 'id': id_item, 'antes': parte, 'depois': f'{os.path.basename(caminho_png)} {largura_px}×{altura_px}px → {cx/360000:.1f}×{cy/360000:.1f} cm', 'controlado': False})

    # ------------------------------------------------------------ remoção de intervalo (Apêndice D)
    def remover_intervalo(self, trecho_inicio, trecho_fim_exclusivo, apos=0, validador=None, local='', id_item=''):
        """Remove todos os parágrafos de [parágrafo que contém trecho_inicio, parágrafo que contém trecho_fim_exclusivo)."""
        ini, _ = self._achar_paragrafo(trecho_inicio, 1, apos)
        fim, _ = self._achar_paragrafo(trecho_fim_exclusivo, 1, ini)
        bloco = self.doc[ini:fim]
        assert '<w:sectPr' not in bloco and '<w:tbl>' not in bloco, 'intervalo contém sectPr/tabela'
        textos = [self.texto(p) for _, _, p in self.paragrafos(ini, fim)]
        if validador:
            validador(textos, bloco)
        rids = re.findall(r'r:embed="(rId\d+)"', bloco)
        self.doc = self.doc[:ini] + self.doc[fim:]
        for rid in rids:
            if f'r:embed="{rid}"' not in self.doc:
                m = re.search(r'<Relationship [^>]*Id="' + rid + r'"[^>]*/>', self.rels)
                if m:
                    alvo = re.search(r'Target="([^"]+)"', m.group(0)).group(1)
                    self.rels = self.rels.replace(m.group(0), '')
                    self.partes.pop('word/' + alvo.lstrip('/'), None)
        self.log.append({'op': 'remover_intervalo', 'local': local, 'id': id_item, 'antes': ' | '.join(t[:60] for t in textos if t), 'depois': f'(removidos {len(textos)} parágrafos, {len(rids)} imagens)', 'controlado': False})
        return textos

    # ------------------------------------------------------------ legendas SEQ
    def legenda_seq(self, ini, fim, rotulo, numero, titulo, centralizar):
        jc = '<w:jc w:val="center"/>' if centralizar else ''
        ppr = f'<w:pPr><w:pStyle w:val="Caption"/><w:keepNext/>{jc}</w:pPr>'
        novo = (f'<w:p>{ppr}<w:r><w:t xml:space="preserve">{rotulo} </w:t></w:r>'
                f'<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> SEQ {rotulo} \\* ARABIC </w:instrText></w:r>'
                f'<w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>{numero}</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>'
                f'<w:r><w:t xml:space="preserve"> – {_esc(titulo)}</w:t></w:r></w:p>')
        self.doc = self.doc[:ini] + novo + self.doc[fim:]
        return ini, ini + len(novo)

    def campo_toc(self, instr, estilo='TableofFigures', texto_cache='[Atualizar campo: clique com o botão direito → Atualizar campo]'):
        return (f'<w:p><w:pPr><w:pStyle w:val="{estilo}"/></w:pPr><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>'
                f'<w:r><w:instrText xml:space="preserve"> {instr} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>'
                f'<w:r><w:t>{_esc(texto_cache)}</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>')

    # ------------------------------------------------------------ cabeçalho / seções
    def criar_cabecalho_pagina(self):
        """Cria word/header1.xml com campo PAGE à direita (10 pt) e devolve o rId."""
        modelo = next((n for n in self.partes if re.match(r'word/footer\d+\.xml', n)), None)
        raiz = re.search(r'<w:ftr[^>]*>', self.partes[modelo].decode('utf-8')).group(0).replace('w:ftr', 'w:hdr') if modelo else f'<w:hdr {NS_W} {NS_R} {NS_W14}>'
        corpo = ('<w:p><w:pPr><w:jc w:val="right"/></w:pPr>'
                 '<w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>'
                 '<w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>'
                 '<w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>'
                 '<w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>1</w:t></w:r>'
                 '<w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p>')
        xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + raiz + corpo + '</w:hdr>'
        self.partes['word/header1.xml'] = xml.encode('utf-8')
        if 'word/header1.xml' not in self.ordem:
            self.ordem.append('word/header1.xml')
        rid = f'rId{self.proximo_rid}'; self.proximo_rid += 1
        self.rels = self.rels.replace('</Relationships>',
            f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/></Relationships>')
        ct = self.partes['[Content_Types].xml'].decode('utf-8')
        if 'header1.xml' not in ct:
            ct = ct.replace('</Types>', '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/></Types>')
            self.partes['[Content_Types].xml'] = ct.encode('utf-8')
        return rid

    def remover_rodapes(self):
        """Apaga as referências de rodapé de todos os sectPr e as partes footerN.xml."""
        refs = re.findall(r'<w:footerReference [^>]*/>', self.doc)
        self.doc = re.sub(r'<w:footerReference [^>]*/>', '', self.doc)
        for n in [n for n in self.partes if re.match(r'word/footer\d+\.xml', n)]:
            self.partes.pop(n)
            self.ordem.remove(n)
            self.rels = re.sub(r'<Relationship [^>]*Target="' + os.path.basename(n) + r'"[^>]*/>', '', self.rels)
            ct = self.partes['[Content_Types].xml'].decode('utf-8')
            ct = re.sub(r'<Override PartName="/' + re.escape(n) + r'"[^>]*/>', '', ct)
            self.partes['[Content_Types].xml'] = ct.encode('utf-8')
        self.log.append({'op': 'rodapes', 'local': 'sectPr', 'id': 'ABNT paginação', 'antes': f'{len(refs)} footerReference', 'depois': 'removidos', 'controlado': False})

    # ------------------------------------------------------------ estilos
    def estilo_existe(self, style_id):
        return f'w:styleId="{style_id}"' in self.partes['word/styles.xml'].decode('utf-8')

    def adicionar_estilos(self, xml_estilos):
        st = self.partes['word/styles.xml'].decode('utf-8')
        st = st.replace('</w:styles>', xml_estilos + '</w:styles>')
        self.partes['word/styles.xml'] = st.encode('utf-8')

    def substituir_estilo(self, style_id, novo_xml):
        st = self.partes['word/styles.xml'].decode('utf-8')
        padrao = re.compile(r'<w:style [^>]*w:styleId="' + style_id + r'".*?</w:style>', flags=re.S)
        assert padrao.search(st), style_id
        st = padrao.sub(lambda m: novo_xml, st, count=1)
        self.partes['word/styles.xml'] = st.encode('utf-8')

    def salvar(self, destino):
        self.partes['word/document.xml'] = self.doc.encode('utf-8')
        self.partes['word/_rels/document.xml.rels'] = self.rels.encode('utf-8')
        import zipfile
        with zipfile.ZipFile(destino, 'w', zipfile.ZIP_DEFLATED) as z:
            for n in self.ordem:
                if n in self.partes and not n.endswith('/'):
                    z.writestr(n, self.partes[n])
        return destino
