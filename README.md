
[![hacs_badge](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/elax46/card-bolletta)](https://github.com/elax46/card-bolletta/releases/latest)
[![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]
![GitHub last commit](https://img.shields.io/github/last-commit/elax46/card-bolletta)

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg


<div align="center">
  <img src="images/logo.svg" alt="Card Bolletta ⚡️🇮🇹" width="150">
  <h1>Card Bolletta ⚡️🇮🇹</h1>
  <p>Una custom card per Home Assistant pensata appositamente per calcolare e stimare la bolletta elettrica italiana direttamente in tempo reale. 
La card prende i tuoi consumi, applica i costi della materia prima, oneri, perdite di rete, spread, IVA e canone TV, fornendoti una stima accurata del costo del mese corrente. Inoltre, offre una comoda finestra di statistiche per confrontare i dati storici e i consumi dei mesi precedenti.</p>
</div>

---

## 📸 Screenshots

<p align="center">
  <img src="images/card-main.png" width="45%" alt="Vista Principale">
  <img src="images/card-stats.png" width="45%" alt="Statistiche Dettagliate">
</p>

<p align="center">
  <i>A sinistra la vista principale, a destra il dettaglio delle statistiche e della ripartizione costi.</i>
</p>


## 🚀 Funzionalità

* **Editor Visuale Integrato (GUI):** Configura tutto facilmente senza toccare una riga di codice.
* **Tariffe Monorarie e a Fasce:** Supporta sia i contratti a prezzo fisso che quelli indicizzati (PUN) inserendo i relativi sensori.
* **Calcolo Completo:** Tiene conto di Spread, Costi di Trasporto, Oneri di Sistema, Accise, PCV, Quota Potenza, IVA e Perdite di Rete.
* **Finestra Statistiche:** Un pop-up integrato che mostra il breakdown completo della bolletta (Imposte, Energia, Trasporto, ecc.) e il confronto con il mese precedente.
* **Auto-rilevamento Mese Precedente:** Legge in automatico l'attributo `last_period` dei tuoi Utility Meter per dirti quanto hai speso il mese scorso.

---

## 📦 Installazione

### Metodo 1: Tramite HACS (Consigliato)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=elax46&repository=https%3A%2F%2Fgithub.com%2Felax46%2Fcard-bolletta)


1. Apri **HACS** in Home Assistant.
2. Vai su **Frontend** (Interfaccia).
3. Clicca sui tre puntini in alto a destra e seleziona **Repository personalizzati**.
4. Incolla l'URL di questa repository e seleziona come categoria **Lovelace**.
5. Clicca su **Aggiungi** e poi su **Scarica**.
6. Ricarica la pagina del tuo browser.

### Metodo 2: Installazione Manuale

1. Scarica il file `italy-energy-bill-card.js`.
2. Copia il file nella cartella `/config/www/` del tuo Home Assistant (creala se non esiste).
3. Vai in Home Assistant: **Impostazioni** -> **Plance** -> **Risorse** (clicca sui 3 puntini in alto a destra se non lo vedi).
4. Aggiungi una risorsa con URL: `/local/italy-energy-bill-card.js` e tipo di risorsa: **Modulo JavaScript**.
5. Ricarica la pagina.

---

> [!WARNING]  
> Per una stima accurata dei costi in bolletta, è fondamentale utilizzare sensori di consumo affidabili e inserire le voci di costo nel modo più preciso possibile. Si consiglia di sfruttare la funzione **Valore manuale** per la sorgente di consumo, inserendo i dati dell'ultima bolletta così da calibrare al meglio le singole voci di costo.
---

## 🛠️ Prerequisiti: I sensori Utility Meter e PUN

Per sfruttare la card al massimo delle sue potenzialità (specialmente i dati storici e il confronto con il mese scorso), si consiglia di non usare i consumi totali diretti del dispositivo, ma di creare dei sensori mensili, giornalieri, trimestrali ed annuali tramite l'integrazione ufficiale **Utility Meter** (Contatori) di Home Assistant:

* Vai su *Impostazioni -> Dispositivi e Servizi -> Aiutanti -> Crea Aiutante -> Contatore (Utility Meter)*.
* Crea un sensore con ciclo di azzeramento **Mensile** (questo sarà il tuo sensore principale).

Nel caso in cui hai un contratto a prezzo variabile, basata sul PUN, ti consiglio di installare l'integrazione [Prezzi PUN del mese](https://github.com/virtualdj/pun_sensor)

---

## Installazione

Il modo più semplice per usare la card è tramite l'interfaccia grafica (Editor Visivo):

1. Vai nella tua Dashboard di Home Assistant e clicca su **Modifica plancia**.
2. Clicca su **Aggiungi scheda**.
3. Scorri fino in fondo (o cerca) e seleziona **Custom: Card Bolletta**.
4. Si aprirà l'interfaccia di configurazione:
   * **Sezione 1:** Scegli "Sensore (Reale)" e seleziona il tuo sensore Utility Meter mensile.
   * **Sezione 2, 3, 4, 5:** Compila i campi inserendo i dati del tuo contratto luce (PCV, Spread, Oneri, ecc.). Se hai un costo fisso dell'energia, seleziona "Prezzo Fisso". Se hai il PUN, seleziona "Sensore" e cerca la tua entità del PUN.
   * **Sezione 6 (Opzionale):** Inserisci qui i tuoi Utility Meter Giornalieri, Settimanali, ecc., se vuoi vederli nel pannello delle statistiche.
5. Clicca su **Salva**.

---

## Opzioni avanzate

Se preferisci l'editor di codice o vuoi copiare/incollare configurazioni preimpostate, ecco come funziona la configurazione YAML.

### Esempio di Configurazione Completa

```yaml
type: custom:italy-energy-bill-card
title: Calcolo Bolletta
modo_consumo: ent
consumo_entity: sensor.energia_mensile
tipo_costo: mono
modo_p1: val
p1_val: 0.125
spread: 0.015
trasporto: 0.009
oneri: 0.025
accise: 0.0227
pcv: 12
fissi_rete: 1.8
contatore_kw: 4.5
prezzo_kw: 1.98
canone_tv: 9
iva: 10
perdite_rete: 10
consumo_giornaliero_entity: sensor.energia_giornaliera
consumo_annuale_entity: sensor.energia_annuale
```

### Tabella dei Parametri YAML

| Variabile | Descrizione | Default / Opzioni |
|---|---|---|
| `title` | Titolo della card | "Costo Energia" |
| `modo_consumo` | Origine del consumo principale | `ent` (Sensore) o `val` (Testuale) |
| `consumo_entity` | Entity ID del consumo mensile | es. `sensor.consumo_mese` |
| `tipo_costo` | Tipo di tariffazione | `mono` (Monoraria) o `fasce` (F1/F2/F3) |
| `modo_p1`, `p2`, `p3` | Origine del prezzo (F1, F2, F3 o Mono) | `val` (Fisso) o `ent` (Sensore es. PUN) |
| `p1_ent`, `p1_val` | Entity ID o Valore fisso del prezzo | es. `sensor.pun` o `0.15` |
| `spread` | Spread aggiuntivo del fornitore (€/kWh) | 0 |
| `trasporto`, `oneri`, `accise` | Costi variabili per singolo kWh (€/kWh) | 0 |
| `pcv` | Quota fissa Commercializzazione (€/mese) | 0 |
| `fissi_rete` | Quota fissa Rete/Oneri (€/mese) | 0 |
| `contatore_kw` | Potenza impegnata contatore | 3 (es. 1.5, 3, 4.5, 6) |
| `prezzo_kw` | Costo mensile per kW di potenza impegnata | 1.98 |
| `canone_tv` | Costo mensile canone RAI | 0 (Imposta 9 può variare nel corso degli anni) |
| `iva` | Aliquota IVA applicata (%) | 10 (o 22) |
| `perdite_rete` | Perdite di rete applicate alla mat. prima (%) | 10 |
| `consumo_giornaliero_entity` | (Opzionale) Storico per le statistiche | es. `sensor.consumo_oggi` |

## 💻 Sviluppo

Vuoi contribuire al progetto, modificare la grafica o cambiare i calcoli matematici? Ecco come impostare l'ambiente di sviluppo per testare le modifiche in tempo reale (HMR) bypassando i problemi di cache di Home Assistant.

### 1. Prerequisiti
* Installare [Node.js](https://nodejs.org/) e [Vite](https://vite.dev/) sul proprio computer.
* Avere un editor di codice (es. Visual Studio Code).

### 2. Avviare lo Sviluppo in Tempo Reale
1. Nel terminale avvia il server locale di Vite:
   ```bash
   npm run dev
   ```
   *Vite partirà all'indirizzo `http://localhost:3000` (o l'IP del tuo computer sulla rete locale).*

2. Vai nel tuo Home Assistant: *Impostazioni -> Plance -> Risorse*.
3. Aggiungi (o modifica se già presente) la risorsa della card inserendo l'URL del dev server di Vite. Assicurati di usare l'IP di rete del tuo computer se HA gira su un'altra macchina (es. un Raspberry Pi).
   * **URL:** `http://[INDIRIZZO_IP_DEL_TUO_PC]:3000/italy-energy-bill-card.js`
   * **Tipo:** Modulo JavaScript

Ora, ogni volta che modificherai il file `.js` e salverai, Vite re-compilerà istantaneamente il codice e Home Assistant aggiornerà la card sulla plancia senza dover svuotare manualmente la cache ogni volta!

### 3. Build
Una volta completata la fase di sviluppo puoi esegui il comando di build (`npm run build`). Questo creerà la cartella `dist/` con dentro il file `italy-energy-bill-card.js` pronto per essere caricato sulla tua istanza HA