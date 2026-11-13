// Lettura dei consumi dalle statistiche a lungo termine di Home Assistant (recorder).
// Funziona sia con le statistiche esterne (es. `contatore_letture:<pod>_energia` dell'integrazione
// HomeAssistant-Contatore) sia con le statistiche dei sensori (es. `sensor.consumo_totale`),
// purché siano statistiche con somma cumulativa (`has_sum`) di energia.

export const STAT_REFRESH_MS = 15 * 60 * 1000;   // ogni quanto rileggere la statistica
const ENERGY_UNITS = ['Wh', 'kWh', 'MWh', 'GWh'];

// Inizio del periodo di fatturazione corrente e di quello precedente.
// Il bimestre è quello di calendario (Gen-Feb, Mar-Apr, ...), come l'Utility Meter bimestrale.
export function periodBounds(now, bimestrale) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const len = bimestrale ? 2 : 1;
  const startMonth = bimestrale ? m - (m % 2) : m;
  return {
    curStart: new Date(y, startMonth, 1),
    prevStart: new Date(y, startMonth - len, 1),
  };
}

function startOfWeek(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));   // settimana da lunedì
  return d;
}

function rowStart(row) {
  // Dalle versioni recenti di HA `start` è un timestamp in ms, nelle più vecchie una stringa ISO.
  return typeof row.start === 'number' ? row.start : Date.parse(row.start);
}

// Elenco delle statistiche di energia con somma cumulativa, esterne per prime.
export async function listEnergyStatistics(hass) {
  const list = await hass.callWS({ type: 'recorder/list_statistic_ids', statistic_type: 'sum' });
  return (list || [])
    .filter((s) => s.has_sum !== false
      && (s.unit_class === 'energy' || ENERGY_UNITS.includes(s.statistics_unit_of_measurement)))
    .sort((a, b) => {
      const extA = a.statistic_id.includes(':') ? 0 : 1;
      const extB = b.statistic_id.includes(':') ? 0 : 1;
      if (extA !== extB) return extA - extB;
      return (a.name || a.statistic_id).localeCompare(b.name || b.statistic_id);
    });
}

// Legge i consumi giornalieri della statistica e li aggrega per i periodi usati dalla card.
// I valori sono in kWh; `null` significa "nessun dato nel periodo".
export async function fetchStatisticSummary(hass, statisticId, bimestrale, now = new Date()) {
  const { curStart, prevStart } = periodBounds(now, bimestrale);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const weekStart = startOfWeek(now);
  const start = new Date(Math.min(prevStart, yearStart, weekStart));

  const res = await hass.callWS({
    type: 'recorder/statistics_during_period',
    start_time: start.toISOString(),
    end_time: now.toISOString(),
    statistic_ids: [statisticId],
    period: 'day',
    types: ['change'],
    units: { energy: 'kWh' },
  });

  const rows = ((res && res[statisticId]) || [])
    .map((r) => ({ start: rowStart(r), change: r.change }))
    .filter((r) => !isNaN(r.start) && typeof r.change === 'number')
    .sort((a, b) => a.start - b.start);

  const sumFrom = (from, to = Infinity) => {
    const sel = rows.filter((r) => r.start >= from.valueOf() && r.start < to.valueOf());
    return sel.length ? sel.reduce((acc, r) => acc + r.change, 0) : null;
  };

  const last = rows.length ? rows[rows.length - 1] : null;
  return {
    statisticId,
    found: rows.length > 0,
    current: sumFrom(curStart),
    previous: sumFrom(prevStart, curStart),
    lastDay: last ? { date: new Date(last.start), value: last.change } : null,
    week: sumFrom(weekStart),
    quarter: sumFrom(quarterStart),
    year: sumFrom(yearStart),
  };
}
