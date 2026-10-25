# -*- coding: utf-8 -*-
"""Fase 4 — passo 1: aceita todas as alterações controladas da v2 numa CÓPIA (Word COM).

Entrada: docs/tg/SISZOO_v2_alinhado.docx (não é tocado).
Saída:   docs/tg/build/v3_aceito.docx
"""
import os, shutil, zipfile, re, sys
import win32com.client

RAIZ = r'C:\Users\isaqu\Desktop\codigo\SISZOO\docs\tg'
ORIG = os.path.join(RAIZ, 'SISZOO_v2_alinhado.docx')
BUILD = os.path.join(RAIZ, 'build')
COPIA = os.path.join(BUILD, 'v2_copia_sem_updatefields.docx')
DEST = os.path.join(BUILD, 'v3_aceito.docx')
os.makedirs(BUILD, exist_ok=True)

# 1) cópia sem w:updateFields (evita o diálogo "atualizar campos?" na automação)
zin = zipfile.ZipFile(ORIG)
with zipfile.ZipFile(COPIA, 'w', zipfile.ZIP_DEFLATED) as zout:
    for n in zin.namelist():
        dados = zin.read(n)
        if n == 'word/settings.xml':
            dados = re.sub(rb'<w:updateFields[^>]*/>', b'', dados)
        zout.writestr(n, dados)
zin.close()

# 2) Word: aceitar tudo e salvar
word = win32com.client.DispatchEx('Word.Application')
word.Visible = False
word.DisplayAlerts = 0
try:
    doc = word.Documents.Open(COPIA, ConfirmConversions=False, ReadOnly=False, AddToRecentFiles=False)
    antes = doc.Revisions.Count
    doc.TrackRevisions = False
    doc.AcceptAllRevisions()
    depois = doc.Revisions.Count
    if os.path.exists(DEST):
        os.remove(DEST)
    doc.SaveAs2(DEST, FileFormat=16)   # wdFormatXMLDocument
    doc.Close(False)
    print(f'revisoes antes={antes} depois={depois} -> {DEST}')
finally:
    word.Quit()

# 3) conferência estrutural
z = zipfile.ZipFile(DEST)
d = z.read('word/document.xml').decode('utf-8')
print('w:ins', d.count('<w:ins '), 'w:del', d.count('<w:del '), 'delText', d.count('<w:delText'), 'drawings', d.count('<w:drawing>'))
print('media', len([n for n in z.namelist() if n.startswith('word/media/')]))
