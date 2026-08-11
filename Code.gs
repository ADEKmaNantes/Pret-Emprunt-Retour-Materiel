/**
 * Script à coller dans un projet créé sur script.google.com
 * (utile si tu n'as pas accès au menu Extensions > Apps Script, ex: sur tablette).
 *
 * Avant de déployer : remplace SHEET_ID ci-dessous par l'identifiant de ton
 * Google Sheet, visible dans son URL entre "/d/" et "/edit" :
 * https://docs.google.com/spreadsheets/d/CET_IDENTIFIANT_ICI/edit
 *
 * Le Sheet doit contenir un onglet nommé "Sorties" avec cette ligne d'en-tête en A1:H1 :
 * id | materiel | agence | dateSortie | responsable | dateRetourPrevue | dateRetourEffective | type
 *
 * IMPORTANT : toutes les requêtes (lecture ET écriture) passent par doGet.
 * Les requêtes POST envoyées depuis un site externe (ex: GitHub Pages) vers
 * un Web App Apps Script peuvent échouer côté navigateur à cause d'une
 * redirection Google que le fetch() ne sait pas relire correctement. Passer
 * en GET pour tout (lecture et écriture) évite ce problème.
 */

const SHEET_ID = 'COLLE_L_ID_DE_TA_FEUILLE_ICI';
const SHEET_NAME = 'Sorties';

function getSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
}

// Point d'entrée unique : lecture si pas d'action, écriture sinon
function doGet(e) {
  if (e.parameter.action) {
    return handleWrite(e);
  }
  return handleRead(e);
}

// Conservé par compatibilité si jamais un ancien appel POST arrive encore
function doPost(e) {
  return handleWrite(e);
}

function handleRead(e) {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1)
    .filter(row => row[0] !== '') // ignore les lignes vides
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        // Normalise les dates en format ISO (AAAA-MM-JJ)
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
        obj[h] = val;
      });
      return obj;
    });

  return ContentService.createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleWrite(e) {
  const sheet = getSheet();
  const action = e.parameter.action;
  let result = { success: true };

  try {
    if (action === 'add') {
      sheet.appendRow([
        e.parameter.id,
        e.parameter.materiel,
        e.parameter.agence,
        e.parameter.dateSortie,
        e.parameter.responsable,
        e.parameter.dateRetourPrevue || '',
        e.parameter.dateRetourEffective || '',
        e.parameter.type || 'pret'
      ]);
    } else if (action === 'return') {
      const rowIndex = findRowById(sheet, e.parameter.id);
      if (rowIndex === -1) throw new Error('Ligne introuvable');
      sheet.getRange(rowIndex, 7).setValue(e.parameter.dateRetourEffective);
    } else if (action === 'delete') {
      const rowIndex = findRowById(sheet, e.parameter.id);
      if (rowIndex === -1) throw new Error('Ligne introuvable');
      sheet.deleteRow(rowIndex);
    } else {
      throw new Error('Action inconnue: ' + action);
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function findRowById(sheet, id) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      return i + 1; // +1 car les lignes du Sheet sont 1-indexées
    }
  }
  return -1;
}
