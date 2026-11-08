#!/usr/bin/env python3
"""Aggiorna data/arera.json con i parametri ARERA (servizio a tutela graduale, domestici non vulnerabili).

Il parsing del file Excel ARERA è adattato dall'integrazione Home Assistant "Bolletta"
di Sanji78 (https://github.com/Sanji78/bolletta, licenza MIT).

Valori prodotti per ogni mese e per ogni tipo di utenza (residente / non_residente):
  trasporto_kwh          €/kWh     servizi di rete, quota energia
  oneri_kwh              €/kWh     ASOS + ARIM
  quota_fissa_mese       €/mese    quota fissa trasporto + quota fissa oneri ASOS/ARIM (valore annuo / 12);
                                   la quota fissa di ASOS è prevista solo per le abitazioni non residenti
  quota_potenza_kw_mese  €/kW/mese quota potenza trasporto + eventuale quota potenza oneri (valore annuo / 12)

ATTENZIONE: il layout del file ARERA è letto con offset di righe relativi alle etichette,
quindi va ricontrollato se ARERA cambia il formato. Lo script termina con errore
se non riesce a ricavare nessun valore, così la GitHub Action fallisce in modo visibile.
"""
import io
import json
import re
import sys
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

import openpyxl

BASE_URL = "https://www.arera.it/fileadmin/area_operatori/prezzi_e_tariffe/"
FILENAME = "E{year}_stg_domesticiNonVulnerabili.xlsx"
OUT = Path(__file__).resolve().parent.parent / "data" / "arera.json"

LABELS = {
    "residente": "abitazioni di residenza anagrafica",
    "non_residente": "abitazioni diverse dalla residenza anagrafica",
}
MONTHS = {
    "gen": 1, "gennaio": 1, "feb": 2, "febbraio": 2, "mar": 3, "marzo": 3,
    "apr": 4, "aprile": 4, "mag": 5, "maggio": 5, "giu": 6, "giugno": 6,
    "lug": 7, "luglio": 7, "ago": 8, "agosto": 8, "set": 9, "settembre": 9,
    "ott": 10, "ottobre": 10, "nov": 11, "novembre": 11, "dic": 12, "dicembre": 12,
}


def num(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip()
    if not s:
        return None
    try:
        if s.endswith("%"):
            return float(s[:-1].replace(",", ".")) / 100.0
        s = re.sub(r"[^\d.\-eE]", "", s.replace(" ", "").replace(",", "."))
        return float(s) if s not in ("", "-", ".", "+") else None
    except ValueError:
        return None


def sheet_period(name):
    """Ricava (anno, mese) dal nome del foglio, es. 'Gennaio 2026'."""
    low = name.lower()
    year = re.search(r"(20\d{2})", low)
    if not year:
        return None
    for token in re.findall(r"[a-zà-ù]+", low):
        if token in MONTHS:
            return int(year.group(1)), MONTHS[token]
    return None


def extract(sheet, label):
    """Estrae i parametri per una categoria di utenza. Ritorna dict (anche parziale)."""
    out = {}
    label_row = None
    for r in range(1, sheet.max_row + 1):
        v = sheet.cell(row=r, column=2).value
        if v is not None and label in str(v).strip().lower():
            label_row = r
            break
    if label_row is None:
        return out

    header = label_row + 1
    value_row = header + 3
    asos = arim = servizi_col = asos_col = arim_col = None
    for c in range(1, sheet.max_column + 1):
        h = sheet.cell(row=header, column=c).value
        if h is None:
            continue
        text = " ".join(str(h).split()).lower()
        if "asos" in text and asos_col is None:
            asos_col = c
            asos = num(sheet.cell(row=value_row, column=c).value)
        if "arim" in text and arim_col is None:
            arim_col = c
            arim = num(sheet.cell(row=value_row, column=c).value)
        if "tariffa" in text and "rete" in text:
            servizi_col = c

    if asos is not None and arim is not None:
        out["oneri_kwh"] = round(asos + arim, 8)
    if servizi_col is not None:
        energia = num(sheet.cell(row=header + 3, column=servizi_col).value)
        fissa = num(sheet.cell(row=header + 4, column=servizi_col).value)
        potenza = num(sheet.cell(row=header + 5, column=servizi_col).value)
        if energia is not None:
            out["trasporto_kwh"] = round(energia, 8)
        # Quota fissa e quota potenza degli oneri (ASOS/ARIM): '-' per i residenti,
        # valorizzata per i non residenti (es. ASOS 95,0916 €/anno). '-' e celle vuote valgono 0.
        oneri_cols = [c for c in (asos_col, arim_col) if c]
        oneri_fissa = sum(num(sheet.cell(row=header + 4, column=c).value) or 0.0 for c in oneri_cols)
        oneri_potenza = sum(num(sheet.cell(row=header + 5, column=c).value) or 0.0 for c in oneri_cols)
        if fissa is not None:
            out["quota_fissa_mese"] = round((fissa + oneri_fissa) / 12.0, 8)
        if potenza is not None:
            out["quota_potenza_kw_mese"] = round((potenza + oneri_potenza) / 12.0, 8)
    return out


def parse_workbook(content):
    wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    periods = {}
    for name in wb.sheetnames:
        ym = sheet_period(name)
        if not ym:
            print(f"  salto il foglio '{name}' (mese/anno non riconosciuti)")
            continue
        entry = {}
        for tipo, label in LABELS.items():
            vals = extract(wb[name], label)
            if vals:
                entry[tipo] = vals
            else:
                print(f"  foglio '{name}': nessun dato per '{tipo}'")
        if entry:
            periods[f"{ym[0]}-{ym[1]:02d}"] = entry
    return periods


def download(year):
    url = BASE_URL + FILENAME.format(year=year)
    print(f"Scarico {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 card-bolletta-updater"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def main():
    today = date.today()
    years = {today.year}
    if today.month <= 2:
        years.add(today.year - 1)

    try:
        current = json.loads(OUT.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        current = {}
    periods = dict(current.get("periods", {}))
    before = json.dumps(periods, sort_keys=True)

    found = 0
    for year in sorted(years):
        try:
            parsed = parse_workbook(download(year))
        except Exception as exc:  # file non ancora pubblicato o errore di rete
            print(f"  anno {year}: {exc}")
            continue
        found += len(parsed)
        periods.update(parsed)

    if not found:
        print("ERRORE: nessun valore ricavato dai file ARERA", file=sys.stderr)
        return 1

    if json.dumps(periods, sort_keys=True) == before:
        print("Nessuna variazione.")
        return 0

    result = {
        "source": "ARERA - servizio a tutela graduale, clienti domestici non vulnerabili",
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "periods": dict(sorted(periods.items())),
    }
    OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Scritto {OUT} ({len(periods)} periodi)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
