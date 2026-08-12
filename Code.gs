/**
 * Script à coller dans un projet créé sur script.google.com
 * (utile si tu n'as pas accès au menu Extensions > Apps Script, ex: sur tablette).
 *
 * Avant de déployer : remplace SHEET_ID ci-dessous par l'identifiant de ton
 * Google Sheet, visible dans son URL entre "/d/" et "/edit" :
 * https://docs.google.com/spreadsheets/d/CET_IDENTIFIANT_ICI/edit
 *
 * Le Sheet doit contenir un onglet nommé "Sorties" avec cette ligne d'en-tête en A1:J1 :
 * id | materiel | agence | dateSortie | responsable | dateRetourPrevue | dateRetourEffective | type | deletedAt | deletedBy
 *
 * SÉCURITÉ SUPPRESSION : les suppressions sont "douces" — la ligne n'est
 * jamais vraiment effacée du Sheet, elle est seulement marquée avec une date
 * et le nom de la personne qui a supprimé (colonnes deletedAt / deletedBy).
 * Elle disparaît du registre principal mais reste consultable et restaurable
 * dans la Corbeille. Cela protège contre les faux clics ET dissuade toute
 * suppression malveillante puisque rien ne disparaît vraiment ni sans trace.
 *
 * IMPORTANT : ce script répond en JSONP (callback=nomDeFonction dans l'URL).
 * Les Web Apps Apps Script n'envoient pas d'en-tête CORS (Access-Control-
 * Allow-Origin), donc un fetch() classique depuis un site externe (GitHub
 * Pages) est bloqué par le navigateur même si la requête aboutit. Charger
 * la réponse via une balise <script> (JSONP) contourne cette limitation.
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

function sheetRowsToObjects(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  return values.slice(1)
    .filter(row => row[0] !== '') // ignore les lignes vides
    .map((row, idx) => {
      const obj = { __row: idx + 2 }; // +2 : ligne réelle dans le Sheet (1-indexé + en-tête)
      headers.forEach((h, i) => {
        let val = row[i];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
        obj[h] = val;
      });
      return obj;
    });
}

function handleRead(e) {
  const sheet = getSheet();
  const rows = sheetRowsToObjects(sheet);

  if (e.parameter.trash === '1') {
    // Corbeille : uniquement les lignes marquées supprimées
    const deleted = rows.filter(r => r.deletedAt).map(stripRowMeta);
    return respond(deleted, e);
  }

  // Registre principal : uniquement les lignes NON supprimées
  const active = rows.filter(r => !r.deletedAt).map(stripRowMeta);
  return respond(active, e);
}

function stripRowMeta(row) {
  const copy = Object.assign({}, row);
  delete copy.__row;
  return copy;
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
        e.parameter.type || 'pret',
        '', // deletedAt
        ''  // deletedBy
      ]);
    } else if (action === 'return') {
      const row = findRowById(sheet, e.parameter.id);
      if (!row) throw new Error('Ligne introuvable');
      sheet.getRange(row, 6).setValue(e.parameter.dateRetourEffective); // dateRetourPrevue alignée sur la date réelle
      sheet.getRange(row, 7).setValue(e.parameter.dateRetourEffective); // dateRetourEffective
    } else if (action === 'delete') {
      if (!e.parameter.deletedBy) throw new Error('Nom requis pour supprimer');
      const row = findRowById(sheet, e.parameter.id);
      if (!row) throw new Error('Ligne introuvable');
      sheet.getRange(row, 9).setValue(new Date()); // deletedAt
      sheet.getRange(row, 10).setValue(e.parameter.deletedBy); // deletedBy
    } else if (action === 'restore') {
      const row = findRowById(sheet, e.parameter.id);
      if (!row) throw new Error('Ligne introuvable');
      sheet.getRange(row, 9).setValue(''); // deletedAt
      sheet.getRange(row, 10).setValue(''); // deletedBy
    } else {
      throw new Error('Action inconnue: ' + action);
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  return respond(result, e);
}

// Répond en JSONP si un callback est fourni dans l'URL, sinon en JSON brut
function respond(data, e) {
  const json = JSON.stringify(data);
  if (e.parameter.callback) {
    const output = ContentService.createTextOutput(`${e.parameter.callback}(${json})`);
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return output;
  }
  const output = ContentService.createTextOutput(json);
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// Renvoie le numéro de ligne réel dans le Sheet (1-indexé) pour un id donné
function findRowById(sheet, id) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      return i + 1;
    }
  }
  return null;
}
