/* =====================================================
   PQRS APP — app.js
   Alarmavision Services S.A.S.
===================================================== */

// ─── CONFIGURACIÓN GOOGLE APPS SCRIPT ────────────────
// Reemplaza esta URL con la URL de tu Web App desplegada
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx3H4xmFfrSu_BOTX2BzjizX-_9s05ooW9mXUnaSV164Yb0E6fV7fawR-Ke1Kfw14IJHw/exec';

const HISTORIAL_KEY   = 'pqrs_historial'; // clave en localStorage
 
let deferredPrompt    = null;
let pendingDeleteId   = null; // ID pendiente de confirmar borrado
 
// ─── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setFechaAuto();
  initTabs();
  initForm();
  initConsulta();
  initModal();
  initHistorial();
  initPWA();
  registerSW();
  actualizarBadge();
});
 
// ─── FECHA AUTOMÁTICA ─────────────────────────────────
function setFechaAuto() {
  const el = document.getElementById('fechaAuto');
  if (el) el.textContent = getFechaHoy();
}
 
function getFechaHoy() {
  const n = new Date();
  return `${pad(n.getDate())}/${pad(n.getMonth()+1)}/${n.getFullYear()}`;
}
 
function pad(n) { return String(n).padStart(2, '0'); }
 
// ─── TABS ─────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + target).classList.add('active');
 
      // Refrescar lista al entrar a historial
      if (target === 'historial') renderHistorial();
    });
  });
}
 
// ─── ID ÚNICO ─────────────────────────────────────────
function generarId() {
  const n    = new Date();
  const f    = `${n.getFullYear()}${pad(n.getMonth()+1)}${pad(n.getDate())}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PQRS-${f}-${rand}`;
}
 
// ─── VALIDACIÓN ───────────────────────────────────────
function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  document.querySelectorAll('.error-field').forEach(el => el.classList.remove('error-field'));
}
 
function showError(fieldId, msgId, message) {
  const field = document.getElementById(fieldId);
  const msg   = document.getElementById(msgId);
  if (field) field.classList.add('error-field');
  if (msg)   msg.textContent = message;
}
 
function validateForm() {
  clearErrors();
  let valid = true;
 
  if (!document.getElementById('nombre').value.trim()) {
    showError('nombre', 'err-nombre', '⚠ El nombre completo es obligatorio.');
    valid = false;
  }
  if (!document.getElementById('documento').value.trim()) {
    showError('documento', 'err-documento', '⚠ El documento de identidad es obligatorio.');
    valid = false;
  }
  if (!document.querySelector('input[name="tipo"]:checked')) {
    document.getElementById('err-tipo').textContent = '⚠ Debes seleccionar un tipo de solicitud.';
    valid = false;
  }
  const desc = document.getElementById('descripcionText').value.trim();
  if (!desc) {
    showError('descripcionText', 'err-descripcion', '⚠ La descripción es obligatoria.');
    valid = false;
  } else if (desc.length < 20) {
    showError('descripcionText', 'err-descripcion', '⚠ La descripción debe tener al menos 20 caracteres.');
    valid = false;
  }
 
  if (!valid) {
    const first = document.querySelector('.error-field, .error-msg:not(:empty)');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return valid;
}
 
// ─── FORMULARIO ───────────────────────────────────────
function initForm() {
  const form = document.getElementById('pqrsForm');
  if (!form) return;
 
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
 
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText   = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
 
    btnSubmit.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
 
    const tipoEl = document.querySelector('input[name="tipo"]:checked');
    const tipo   = tipoEl ? tipoEl.value : '';
    const pqrsId = generarId();
    const fecha  = getFechaHoy();
 
    const payload = {
      action:      'enviar',
      id:          pqrsId,
      fecha,
      nombre:      document.getElementById('nombre').value.trim(),
      documento:   document.getElementById('documento').value.trim(),
      cargo:       document.getElementById('cargo').value.trim(),
      tipo,
      descripcion: document.getElementById('descripcionText').value.trim(),
    };
 
    try {
      await enviarAGoogleSheets(payload);
 
      // ── Guardar en historial local ──────────────────
      guardarEnHistorial({
        id:          pqrsId,
        fecha,
        nombre:      payload.nombre,
        documento:   payload.documento,
        cargo:       payload.cargo,
        tipo,
        descripcion: payload.descripcion,
        enviadoEn:   new Date().toISOString(),
      });
 
      mostrarModalExito(pqrsId);
      form.reset();
      clearErrors();
      actualizarBadge();
 
    } catch (err) {
      console.error('Error al enviar:', err);
      alert('❌ Ocurrió un error al enviar la solicitud. Por favor intenta nuevamente.\n\nDetalle: ' + err.message);
    } finally {
      btnSubmit.disabled = false;
      btnText.classList.remove('hidden');
      btnLoader.classList.add('hidden');
    }
  });
}
 
// ─── GOOGLE SHEETS ────────────────────────────────────
async function enviarAGoogleSheets(data) {
  if (APPS_SCRIPT_URL.includes('TU_DEPLOYMENT_ID')) {
    guardarLocal(data);
    await delay(700);
    return;
  }
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => formData.append(k, v));
  const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: formData });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  if (result.status !== 'ok') throw new Error(result.message || 'Error desconocido');
}
 
// ─── STORAGE LOCAL (demo) ─────────────────────────────
function guardarLocal(data) {
  const registros = JSON.parse(localStorage.getItem('pqrs_registros') || '[]');
  registros.push({ ...data, estado: 'Pendiente', responsable: '', acciones: '', fechaAsignacion: '', fechaRespuesta: '', observaciones: '' });
  localStorage.setItem('pqrs_registros', JSON.stringify(registros));
}
 
function buscarLocal(id) {
  const registros = JSON.parse(localStorage.getItem('pqrs_registros') || '[]');
  return registros.find(r => r.id === id.trim().toUpperCase()) || null;
}
 
// ─── HISTORIAL LOCAL ──────────────────────────────────
function getHistorial() {
  try {
    return JSON.parse(localStorage.getItem(HISTORIAL_KEY) || '[]');
  } catch { return []; }
}
 
function guardarEnHistorial(entrada) {
  const hist = getHistorial();
  // Evitar duplicados por si acaso
  const existe = hist.find(h => h.id === entrada.id);
  if (!existe) {
    hist.unshift(entrada); // más reciente primero
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(hist));
  }
}
 
function eliminarDelHistorial(id) {
  const hist = getHistorial().filter(h => h.id !== id);
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(hist));
}
 
function limpiarHistorial() {
  localStorage.removeItem(HISTORIAL_KEY);
}
 
// ─── BADGE DEL TAB HISTORIAL ──────────────────────────
function actualizarBadge() {
  const badge = document.getElementById('historialBadge');
  if (!badge) return;
  const count = getHistorial().length;
  if (count === 0) {
    badge.classList.add('hidden');
  } else {
    badge.classList.remove('hidden');
    badge.textContent = count > 99 ? '99+' : count;
  }
}
 
// ─── RENDER HISTORIAL ─────────────────────────────────
function initHistorial() {
  // Botón limpiar todo
  document.getElementById('btnLimpiarTodo')?.addEventListener('click', () => {
    const hist = getHistorial();
    if (hist.length === 0) return;
    abrirConfirm(
      '¿Limpiar todo el historial?',
      `Se eliminarán ${hist.length} solicitud(es) de este dispositivo. El registro en la empresa NO se borra.`,
      '__ALL__'
    );
  });
 
  renderHistorial();
}
 
function renderHistorial() {
  const lista = document.getElementById('historialLista');
  if (!lista) return;
 
  const hist = getHistorial();
 
  if (hist.length === 0) {
    lista.innerHTML = `
      <div class="hist-empty">
        <div class="hist-empty-icon">📭</div>
        <p>Aún no has enviado ninguna PQRS desde este dispositivo.</p>
        <p style="font-size:12px;color:#aaa;margin-top:4px;">Cuando envíes una solicitud aparecerá aquí.</p>
      </div>`;
    return;
  }

  const tipoIcono = {
    'Petición':    '📋',
    'Queja':       '😤',
    'Reclamo':     '⚠️',
    'Sugerencia':  '💡',
    'Felicitación':'🌟',
  };
 
  lista.innerHTML = `<div class="hist-lista">${hist.map(item => `
    <div class="hist-card" id="hcard-${item.id}" data-tipo="${escapeHtml(item.tipo)}">
      <div class="hist-card-top">
        <div class="hist-card-id">
          <span class="hist-id-label">ID</span>
          <span class="hist-id-value">${escapeHtml(item.id)}</span>
          <button class="btn-copy-hist" data-id="${escapeHtml(item.id)}" title="Copiar ID">📋</button>
        </div>
        <div class="hist-card-actions">
          <button class="btn-consultar-hist" data-id="${escapeHtml(item.id)}" title="Ver estado">🔍 Ver estado</button>
          <button class="btn-eliminar-hist" data-id="${escapeHtml(item.id)}" title="Eliminar del historial">🗑</button>
        </div>
      </div>
      <div class="hist-card-body">
        <div class="hist-field">
          <span class="hist-field-label">Tipo</span>
          <span class="hist-tipo-pill hist-tipo-${tipoSlug(item.tipo)}">${tipoIcono[item.tipo] || '📄'} ${escapeHtml(item.tipo)}</span>
        </div>
        <div class="hist-field">
          <span class="hist-field-label">Nombre</span>
          <span class="hist-field-value">${escapeHtml(item.nombre)}</span>
        </div>
        <div class="hist-field">
          <span class="hist-field-label">Fecha de envío</span>
          <span class="hist-field-value">${escapeHtml(item.fecha)}</span>
        </div>
        <div class="hist-field hist-field--full">
          <span class="hist-field-label">Descripción</span>
          <span class="hist-field-value hist-desc">${escapeHtml(item.descripcion)}</span>
        </div>
      </div>
    </div>
  `).join('')}</div>`;
 
  // Eventos: copiar ID
  lista.querySelectorAll('.btn-copy-hist').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      navigator.clipboard?.writeText(id).catch(() => copyFallback(id));
      btn.textContent = '✅';
      setTimeout(() => btn.textContent = '📋', 2000);
    });
  });
 
  // Eventos: consultar estado (redirige al tab consulta con el ID)
  lista.querySelectorAll('.btn-consultar-hist').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelector('[data-tab="consulta"]').classList.add('active');
      document.getElementById('tab-consulta').classList.add('active');
      document.getElementById('consultaId').value = id;
      consultarEstado();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
 
  // Eventos: eliminar individual
  lista.querySelectorAll('.btn-eliminar-hist').forEach(btn => {
    btn.addEventListener('click', () => {
      abrirConfirm(
        '¿Eliminar esta PQRS del historial?',
        'Se eliminará de este dispositivo. El registro en la empresa NO se borra.',
        btn.dataset.id
      );
    });
  });
}
 
// ─── TIPO SLUG para clases CSS ─────────────────────────
function tipoSlug(tipo) {
  const map = {
    'Petición':    'peticion',
    'Queja':       'queja',
    'Reclamo':     'reclamo',
    'Sugerencia':  'sugerencia',
    'Felicitación':'felicitacion',
  };
  return map[tipo] || 'otro';
}
 
// ─── MODAL DE CONFIRMACIÓN ────────────────────────────
function abrirConfirm(titulo, mensaje, id) {
  pendingDeleteId = id;
  document.getElementById('confirmTitle').textContent = titulo;
  document.getElementById('confirmMsg').textContent   = mensaje;
  document.getElementById('confirmModal').classList.remove('hidden');
}
 
function cerrarConfirm() {
  pendingDeleteId = null;
  document.getElementById('confirmModal').classList.add('hidden');
}
 
// ─── MODAL ÉXITO ──────────────────────────────────────
function mostrarModalExito(pqrsId) {
  document.getElementById('modalPqrsId').textContent = pqrsId;
  document.getElementById('successModal').classList.remove('hidden');
}
 
function initModal() {
  // Modal éxito: aceptar
  document.getElementById('btnModalOk')?.addEventListener('click', () => {
    document.getElementById('successModal').classList.add('hidden');
  });
 
  // Modal éxito: copiar ID
  document.getElementById('btnCopyId')?.addEventListener('click', () => {
    const id = document.getElementById('modalPqrsId').textContent;
    navigator.clipboard?.writeText(id).catch(() => copyFallback(id));
    const btn = document.getElementById('btnCopyId');
    btn.textContent = '✅ Copiado';
    setTimeout(() => btn.textContent = '📋 Copiar', 2000);
  });
 
  // Cerrar modal éxito al hacer click fuera
  document.getElementById('successModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });
 
  // Modal confirm: cancelar
  document.getElementById('btnConfirmCancel')?.addEventListener('click', cerrarConfirm);
 
  // Modal confirm: cerrar al click fuera
  document.getElementById('confirmModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) cerrarConfirm();
  });
 
  // Modal confirm: eliminar
  document.getElementById('btnConfirmOk')?.addEventListener('click', () => {
    if (!pendingDeleteId) return;
 
    if (pendingDeleteId === '__ALL__') {
      limpiarHistorial();
    } else {
      eliminarDelHistorial(pendingDeleteId);
      // Animar salida de la card
      const card = document.getElementById('hcard-' + pendingDeleteId);
      if (card) {
        card.style.transition = 'opacity 0.25s, transform 0.25s';
        card.style.opacity = '0';
        card.style.transform = 'translateX(30px)';
        setTimeout(() => renderHistorial(), 260);
      }
    }
 
    cerrarConfirm();
    actualizarBadge();
 
    // Si fue limpiar todo, re-render directo
    if (pendingDeleteId === '__ALL__') renderHistorial();
  });
}
 
// ─── CONSULTA DE ESTADO ───────────────────────────────
function initConsulta() {
  document.getElementById('btnConsultar')?.addEventListener('click', consultarEstado);
  document.getElementById('consultaId')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') consultarEstado();
  });
}
 
async function consultarEstado() {
  const idInput  = document.getElementById('consultaId').value.trim();
  const resultDiv = document.getElementById('consultaResult');
 
  if (!idInput) {
    resultDiv.innerHTML = '<p class="no-result">⚠ Ingresa un ID para consultar.</p>';
    return;
  }
 
  resultDiv.innerHTML = '<p class="no-result">🔄 Consultando...</p>';
 
  try {
    let registro = null;
 
    if (APPS_SCRIPT_URL.includes('TU_DEPLOYMENT_ID')) {
      await delay(600);
      registro = buscarLocal(idInput);
    } else {
      const url = `${APPS_SCRIPT_URL}?action=consultar&id=${encodeURIComponent(idInput)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      registro = data.registro || null;
    }
 
    if (!registro) {
      resultDiv.innerHTML = `
        <div class="no-result">
          <p>❌ No se encontró ninguna PQRS con el ID <strong>${escapeHtml(idInput)}</strong>.</p>
          <p style="margin-top:6px;font-size:12px;">Verifica que el ID sea correcto y esté escrito exactamente como fue generado.</p>
        </div>`;
      return;
    }
 
    resultDiv.innerHTML = renderResultado(registro);
 
  } catch (err) {
    console.error('Error consultando:', err);
    resultDiv.innerHTML = '<p class="no-result">❌ Error al consultar. Verifica tu conexión e intenta nuevamente.</p>';
  }
}
 
function renderResultado(r) {
  const statusClass = getStatusClass(r.estado || 'Pendiente');
  const statusLabel = getStatusLabel(r.estado || 'Pendiente');
 
  return `
  <div class="result-card">
    <div class="result-header" style="background:${getStatusBg(r.estado)}">
      <span class="result-id">🆔 ${escapeHtml(r.id)}</span>
      <span class="status-badge ${statusClass}">${statusLabel}</span>
    </div>
    <div class="result-body">
      <div class="result-section-title">📋 Datos de la Solicitud</div>
      <div class="result-fields-grid">
        <div class="result-field"><span class="rf-label">Nombre completo</span><span class="rf-value">${escapeHtml(r.nombre||'—')}</span></div>
        <div class="result-field"><span class="rf-label">Documento</span><span class="rf-value">${escapeHtml(r.documento||'—')}</span></div>
        <div class="result-field"><span class="rf-label">Cargo</span><span class="rf-value">${escapeHtml(r.cargo||'—')}</span></div>
        <div class="result-field"><span class="rf-label">Tipo de solicitud</span><span class="rf-value">${escapeHtml(r.tipo||'—')}</span></div>
        <div class="result-field"><span class="rf-label">Fecha de envío</span><span class="rf-value">${escapeHtml(r.fecha||'—')}</span></div>
      </div>
      <div class="result-field" style="margin-top:8px">
        <span class="rf-label">Descripción</span>
        <span class="rf-value" style="white-space:pre-wrap;line-height:1.6">${escapeHtml(r.descripcion||'—')}</span>
      </div>
      <div class="result-section-title" style="margin-top:16px">🏢 Respuesta de la Empresa</div>
      <div class="result-fields-grid">
        <div class="result-field"><span class="rf-label">Responsable asignado</span><span class="rf-value">${escapeHtml(r.responsable||'Pendiente de asignación')}</span></div>
        <div class="result-field"><span class="rf-label">Estado</span><span class="rf-value"><span class="status-badge ${statusClass}" style="font-size:11px">${statusLabel}</span></span></div>
        <div class="result-field"><span class="rf-label">Fecha de asignación</span><span class="rf-value">${escapeHtml(r.fechaAsignacion||'—')}</span></div>
        <div class="result-field"><span class="rf-label">Fecha de respuesta</span><span class="rf-value">${escapeHtml(r.fechaRespuesta||'—')}</span></div>
      </div>
      <div class="result-field" style="margin-top:8px"><span class="rf-label">Acciones realizadas</span><span class="rf-value">${escapeHtml(r.acciones||'Pendiente')}</span></div>
      <div class="result-field" style="margin-top:8px"><span class="rf-label">Observaciones finales</span><span class="rf-value">${escapeHtml(r.observaciones||'Pendiente')}</span></div>
    </div>
  </div>`;
}
 
function getStatusClass(e) {
  const s = (e||'').toLowerCase();
  if (s.includes('cerr'))      return 'status-cerrada';
  if (s.includes('seguimiento') || s.includes('proceso')) return 'status-proceso';
  return 'status-pendiente';
}
function getStatusLabel(e) {
  const s = (e||'').toLowerCase();
  if (s.includes('cerr'))        return '✅ Cerrada';
  if (s.includes('seguimiento')) return '🔄 En Seguimiento';
  if (s.includes('proceso'))     return '⚙️ En Proceso';
  return '⏳ Pendiente';
}
function getStatusBg(e) {
  const s = (e||'').toLowerCase();
  if (s.includes('cerr'))      return '#f0fff4';
  if (s.includes('seguimiento') || s.includes('proceso')) return '#f0f7ff';
  return '#fffdf0';
}
 
// ─── UTILS ────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
 
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
 
function copyFallback(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}
 
// ─── PWA INSTALL ──────────────────────────────────────
function initPWA() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBanner').classList.remove('hidden');
  });
  document.getElementById('installBtn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') document.getElementById('installBanner').classList.add('hidden');
    deferredPrompt = null;
  });
  document.getElementById('installClose')?.addEventListener('click', () => {
    document.getElementById('installBanner').classList.add('hidden');
  });
  window.addEventListener('appinstalled', () => {
    document.getElementById('installBanner').classList.add('hidden');
    deferredPrompt = null;
  });
}
 
// ─── SERVICE WORKER ───────────────────────────────────
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(r => console.log('✅ SW:', r.scope))
      .catch(e => console.warn('⚠ SW:', e));
  }
}