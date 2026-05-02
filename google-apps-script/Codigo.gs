/**
 * =====================================================
 * Google Apps Script — Código.gs
 * PQRS Alarmavision Services S.A.S.
 * 
 * INSTRUCCIONES DE DESPLIEGUE:
 * 1. Abre Google Sheets → Extensiones → Apps Script
 * 2. Copia y pega este código completo
 * 3. Guarda (Ctrl+S)
 * 4. Clic en "Implementar" → "Nueva implementación"
 * 5. Tipo: Aplicación web
 * 6. Ejecutar como: Yo (tu cuenta)
 * 7. Quién tiene acceso: Cualquier persona
 * 8. Clic en "Implementar" → Copia la URL generada
 * 9. Pega esa URL en app.js → constante APPS_SCRIPT_URL
 * =====================================================
 */

// ─── CONFIGURACIÓN ────────────────────────────────────
const SHEET_NAME   = 'PQRS';
const SPREADSHEET  = SpreadsheetApp.getActiveSpreadsheet();

// Columnas del spreadsheet (orden)
const COLS = {
  ID:               1,
  FECHA_ENVIO:      2,
  NOMBRE:           3,
  DOCUMENTO:        4,
  CARGO:            5,
  TIPO:             6,
  DESCRIPCION:      7,
  ESTADO:           8,
  RESPONSABLE:      9,
  ACCIONES:         10,
  FECHA_ASIGNACION: 11,
  FECHA_RESPUESTA:  12,
  OBSERVACIONES:    13,
  TIMESTAMP:        14,
};

const HEADERS = [
  'ID PQRS',
  'Fecha de Envío',
  'Nombre Completo',
  'Documento de Identidad',
  'Cargo',
  'Tipo de Solicitud',
  'Descripción de la Solicitud',
  'Estado',
  'Responsable Asignado',
  'Acciones Realizadas',
  'Fecha de Asignación',
  'Fecha de Respuesta',
  'Observaciones Finales',
  'Timestamp',
];

// ─── GET — consultar por ID ───────────────────────────
function doGet(e) {
  const action = e.parameter.action;
  const id     = e.parameter.id;

  const headers = corsHeaders();

  if (action === 'consultar' && id) {
    const registro = buscarPorId(id);
    const payload  = registro
      ? { status: 'ok', registro }
      : { status: 'not_found', registro: null };

    return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'PQRS API activa' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── POST — registrar nueva PQRS ──────────────────────
function doPost(e) {
  try {
    const params = e.parameter;
    const action = params.action;

    if (action === 'enviar') {
      const result = registrarPQRS(params);
      return jsonResponse({ status: 'ok', id: result.id });
    }

    return jsonResponse({ status: 'error', message: 'Acción no reconocida' });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// ─── REGISTRAR PQRS ───────────────────────────────────
function registrarPQRS(params) {
  const sheet = obtenerHoja();
  const now   = new Date();

  const row = new Array(Object.keys(COLS).length).fill('');
  row[COLS.ID - 1]          = params.id || generarId();
  row[COLS.FECHA_ENVIO - 1] = params.fecha || formatFecha(now);
  row[COLS.NOMBRE - 1]      = params.nombre || '';
  row[COLS.DOCUMENTO - 1]   = params.documento || '';
  row[COLS.CARGO - 1]       = params.cargo || '';
  row[COLS.TIPO - 1]        = params.tipo || '';
  row[COLS.DESCRIPCION - 1] = params.descripcion || '';
  row[COLS.ESTADO - 1]      = 'Pendiente';
  row[COLS.RESPONSABLE - 1] = '';
  row[COLS.ACCIONES - 1]    = '';
  row[COLS.FECHA_ASIGNACION - 1] = '';
  row[COLS.FECHA_RESPUESTA - 1]  = '';
  row[COLS.OBSERVACIONES - 1]    = '';
  row[COLS.TIMESTAMP - 1]        = now.toISOString();

  sheet.appendRow(row);
  formatearFila(sheet, sheet.getLastRow());

  return { id: row[0] };
}

// ─── BUSCAR POR ID ────────────────────────────────────
function buscarPorId(id) {
  const sheet  = obtenerHoja();
  const data   = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[COLS.ID - 1]).trim().toUpperCase() === id.trim().toUpperCase()) {
      return {
        id:               row[COLS.ID - 1],
        fecha:            row[COLS.FECHA_ENVIO - 1],
        nombre:           row[COLS.NOMBRE - 1],
        documento:        row[COLS.DOCUMENTO - 1],
        cargo:            row[COLS.CARGO - 1],
        tipo:             row[COLS.TIPO - 1],
        descripcion:      row[COLS.DESCRIPCION - 1],
        estado:           row[COLS.ESTADO - 1] || 'Pendiente',
        responsable:      row[COLS.RESPONSABLE - 1],
        acciones:         row[COLS.ACCIONES - 1],
        fechaAsignacion:  row[COLS.FECHA_ASIGNACION - 1],
        fechaRespuesta:   row[COLS.FECHA_RESPUESTA - 1],
        observaciones:    row[COLS.OBSERVACIONES - 1],
      };
    }
  }
  return null;
}

// ─── HOJA DE CÁLCULO ──────────────────────────────────
function obtenerHoja() {
  let sheet = SPREADSHEET.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = SPREADSHEET.insertSheet(SHEET_NAME);
    configurarHoja(sheet);
  }

  return sheet;
}

function configurarHoja(sheet) {
  // Encabezados
  const headerRow = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRow.setValues([HEADERS]);

  // Estilo encabezados
  headerRow
    .setBackground('#0036ab')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.setRowHeight(1, 36);

  // Anchos de columna
  sheet.setColumnWidth(COLS.ID, 180);
  sheet.setColumnWidth(COLS.FECHA_ENVIO, 110);
  sheet.setColumnWidth(COLS.NOMBRE, 180);
  sheet.setColumnWidth(COLS.DOCUMENTO, 140);
  sheet.setColumnWidth(COLS.CARGO, 130);
  sheet.setColumnWidth(COLS.TIPO, 130);
  sheet.setColumnWidth(COLS.DESCRIPCION, 300);
  sheet.setColumnWidth(COLS.ESTADO, 120);
  sheet.setColumnWidth(COLS.RESPONSABLE, 160);
  sheet.setColumnWidth(COLS.ACCIONES, 220);
  sheet.setColumnWidth(COLS.FECHA_ASIGNACION, 130);
  sheet.setColumnWidth(COLS.FECHA_RESPUESTA, 130);
  sheet.setColumnWidth(COLS.OBSERVACIONES, 220);
  sheet.setColumnWidth(COLS.TIMESTAMP, 160);

  // Validación de datos para columna Estado
  const estadoRange = sheet.getRange(2, COLS.ESTADO, 1000, 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pendiente', 'En Seguimiento', 'Cerrada'], true)
    .setAllowInvalid(false)
    .build();
  estadoRange.setDataValidation(rule);

  // Congelar fila de encabezados
  sheet.setFrozenRows(1);
}

function formatearFila(sheet, rowNum) {
  const range = sheet.getRange(rowNum, 1, 1, HEADERS.length);

  // Fila par: fondo muy claro
  if (rowNum % 2 === 0) {
    range.setBackground('#f0f4ff');
  } else {
    range.setBackground('#ffffff');
  }

  range.setVerticalAlignment('middle');
  sheet.setRowHeight(rowNum, 28);

  // Descripción: wrap text
  sheet.getRange(rowNum, COLS.DESCRIPCION).setWrap(true);

  // Colorear estado
  colorearEstado(sheet, rowNum);
}

function colorearEstado(sheet, rowNum) {
  const estadoCell = sheet.getRange(rowNum, COLS.ESTADO);
  const estado = estadoCell.getValue();

  switch (estado) {
    case 'Pendiente':
      estadoCell.setBackground('#fff3cd').setFontColor('#856404').setFontWeight('bold');
      break;
    case 'En Seguimiento':
      estadoCell.setBackground('#cce5ff').setFontColor('#004085').setFontWeight('bold');
      break;
    case 'Cerrada':
      estadoCell.setBackground('#d4edda').setFontColor('#155724').setFontWeight('bold');
      break;
  }
}

// ─── TRIGGER: al editar estado en el sheet ────────────
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== SHEET_NAME) return;

  const col = e.range.getColumn();
  const row = e.range.getRow();

  if (row === 1) return; // fila de encabezado

  if (col === COLS.ESTADO) {
    colorearEstado(sheet, row);
  }
}

// ─── UTILS ───────────────────────────────────────────
function generarId() {
  const now    = new Date();
  const fecha  = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd');
  const rand   = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PQRS-${fecha}-${rand}`;
}

function formatFecha(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
