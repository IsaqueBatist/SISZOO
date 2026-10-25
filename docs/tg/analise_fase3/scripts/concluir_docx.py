# -*- coding: utf-8 -*-
"""Fase 4 — passo 3: atualiza os campos (SEQ, Sumário, listas) no Word, salva a versão final e exporta o PDF.

Entrada: build/v3_campos.docx  →  Saída: SISZOO_v3_final.docx e SISZOO_v3_final.pdf (em docs/tg).
"""
import os, shutil, sys
import win32com.client

RAIZ = r'C:\Users\isaqu\Desktop\codigo\SISZOO\docs\tg'
ENT = os.path.join(RAIZ, 'build', 'v3_campos.docx')
TMP = os.path.join(RAIZ, 'build', 'v3_trabalho.docx')
DOCX = os.path.join(RAIZ, 'SISZOO_v3_final.docx')
PDF = os.path.join(RAIZ, 'SISZOO_v3_final.pdf')
shutil.copyfile(ENT, TMP)

word = win32com.client.DispatchEx('Word.Application')
word.Visible = False
word.DisplayAlerts = 0
try:
    doc = word.Documents.Open(TMP, ConfirmConversions=False, ReadOnly=False, AddToRecentFiles=False)
    doc.TrackRevisions = False
    print('revisoes:', doc.Revisions.Count, '| campos:', doc.Fields.Count, '| TOCs:', doc.TablesOfContents.Count, '| TOFs:', doc.TablesOfFigures.Count)
    doc.Fields.Update()
    for t in doc.TablesOfContents:
        t.Update()
    for t in doc.TablesOfFigures:
        t.Update()
    doc.Repaginate()
    doc.Fields.Update()
    for t in doc.TablesOfContents:
        t.UpdatePageNumbers()
    for t in doc.TablesOfFigures:
        t.UpdatePageNumbers()
    doc.Repaginate()
    print('paginas:', doc.ComputeStatistics(2), '| inline shapes:', doc.InlineShapes.Count, '| secoes:', doc.Sections.Count)
    # primeira página numerada: a seção 2 começa na Introdução
    sec2 = doc.Sections(2)
    print('secao 2 inicia na pagina:', sec2.Range.Information(3), '| cabecalho sec1 vazio:', not sec2.Headers(1).LinkToPrevious)
    for p in (DOCX, PDF):
        if os.path.exists(p):
            os.remove(p)
    doc.SaveAs2(DOCX, FileFormat=16)
    doc.ExportAsFixedFormat(PDF, 17, False, 0, 0, 0, 0, 0, False, True, 1, True, True, False)
    doc.Close(False)
    print('OK', DOCX, os.path.getsize(DOCX), PDF, os.path.getsize(PDF))
finally:
    word.Quit()
