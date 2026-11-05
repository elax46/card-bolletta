// Gestione dei parametri ARERA "automatici" (modalità `auto`).
// I valori arrivano da un JSON pubblicato nel repository (data/arera.json),
// aggiornato da una GitHub Action (vedi scripts/update_arera.py).

export const DEFAULT_ARERA_URL =
  'https://raw.githubusercontent.com/elax46/card-bolletta/main/data/arera.json';

// nome del parametro nella card -> chiave nel JSON
export const AUTO_PARAMS = {
  trasporto: 'trasporto_kwh',          // €/kWh   (servizi di rete, quota energia)
  oneri: 'oneri_kwh',                  // €/kWh   (ASOS + ARIM)
  fissi_rete: 'quota_fissa_mese',      // €/mese  (quota fissa trasporto)
  prezzo_kw: 'quota_potenza_kw_mese',  // €/kW/mese (quota potenza)
};

const CACHE_KEY = 'card-bolletta:arera:v1';
const TTL_MS = 12 * 60 * 60 * 1000;   // dati considerati freschi per 12 ore
const RETRY_MS = 30 * 60 * 1000;      // dopo un errore riprova dopo 30 minuti

function storage() {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; }
}

export const AreraStore = {
  url: null,
  data: null,
  fetchedAt: 0,
  failed: false,
  _promise: null,

  _readCache() {
    const st = storage();
    if (!st) return;
    try {
      const entry = JSON.parse(st.getItem(CACHE_KEY) || 'null');
      if (entry && entry.url === this.url && entry.data && typeof entry.data.periods === 'object') {
        this.data = entry.data;
        this.fetchedAt = entry.fetchedAt || 0;
      }
    } catch (e) { /* cache non leggibile: si ignora */ }
  },

  _writeCache() {
    const st = storage();
    if (!st) return;
    try {
      st.setItem(CACHE_KEY, JSON.stringify({ url: this.url, fetchedAt: this.fetchedAt, data: this.data }));
    } catch (e) { /* storage pieno o non disponibile */ }
  },

  isFresh(url) {
    const u = url || DEFAULT_ARERA_URL;
    if (this.url !== u || !this.fetchedAt) return false;
    return (Date.now() - this.fetchedAt) < (this.failed ? RETRY_MS : TTL_MS);
  },

  async load(url) {
    const u = url || DEFAULT_ARERA_URL;
    if (this.url !== u) {
      this.url = u; this.data = null; this.fetchedAt = 0; this.failed = false; this._promise = null;
      this._readCache();
    }
    if (this.isFresh(u)) return this.data;
    if (this._promise) return this._promise;

    this._promise = (async () => {
      try {
        const res = await fetch(u, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        if (!json || typeof json.periods !== 'object') throw new Error('formato JSON non valido');
        this.data = json;
        this.failed = false;
        this.fetchedAt = Date.now();
        this._writeCache();
      } catch (e) {
        this.failed = true;
        this.fetchedAt = Date.now();
        console.warn('[card-bolletta] dati ARERA non disponibili, uso i valori manuali:', e);
      } finally {
        this._promise = null;
      }
      return this.data;
    })();
    return this._promise;
  },
};

export function periodKey(date = new Date()) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

// Restituisce { value, period } oppure null se il dato non è disponibile.
// Usa il periodo del mese corrente, altrimenti l'ultimo precedente che contiene il valore.
export function getAutoValue(config, name, now = new Date()) {
  const jsonKey = AUTO_PARAMS[name];
  const data = AreraStore.data;
  if (!jsonKey || !data || !data.periods) return null;
  const tipo = config.tipo_utenza === 'non_residente' ? 'non_residente' : 'residente';
  const key = periodKey(now);
  const periodi = Object.keys(data.periods).filter((p) => p <= key).sort();
  for (let i = periodi.length - 1; i >= 0; i--) {
    const v = data.periods[periodi[i]] && data.periods[periodi[i]][tipo]
      ? data.periods[periodi[i]][tipo][jsonKey] : undefined;
    if (typeof v === 'number' && isFinite(v)) return { value: v, period: periodi[i] };
  }
  return null;
}
