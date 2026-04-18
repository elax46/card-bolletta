import { LitElement, html, css } from 'lit';

// --- EDITOR DELLA CARD (GUI) ---
class ItalyEnergyBillCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object }
    };
  }

  setConfig(config) { this._config = config; }

  _valueChanged(ev) {
    if (!this._config || !this.hass) return;
    const target = ev.target;
    const configValue = target.configValue;
    if (!configValue) return;

    let value = (ev.detail && ev.detail.value !== undefined) ? ev.detail.value : target.value;
    
    if (target.tagName === 'HA-SWITCH') {
      value = target.checked;
    } else if (target.type === 'number') { 
      value = value !== '' ? parseFloat(value) : 0; 
    }

    const newConfig = { ...this._config };
    newConfig[configValue] = value;
    this._config = newConfig;
    this.requestUpdate();

    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig }, bubbles: true, composed: true
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const tipo = this._config.tipo_costo || 'mono';
    const modoConsumo = this._config.modo_consumo || 'ent';

    return html`
      <div class="card-config">
        <div class="row" style="align-items: center; justify-content: space-between; margin-bottom: 15px;">
          <div class="label" style="margin:0;">Modalità Compatta</div>
          <ha-switch .checked="${this._config.layout_compatto}" .configValue="${"layout_compatto"}" @change="${this._valueChanged}"></ha-switch>
        </div>

        <div class="label">Titolo Card</div>
        <input type="text" .value="${this._config.title || ''}" .configValue="${"title"}" @input="${this._valueChanged}" class="styled-input">
        
        <div class="section">1. Consumo Principale (Mensile)</div>
        <div class="label">Sorgente Consumo</div>
        <select .value="${modoConsumo}" .configValue="${"modo_consumo"}" @change="${this._valueChanged}" class="styled-select small" style="margin-bottom: 10px;">
          <option value="ent">Sensore (Reale)</option>
          <option value="val">Valore Manuale (Test)</option>
        </select>

        ${modoConsumo === 'ent' ? html`
          <ha-entity-picker label="Sensore Consumo Mensile (kWh)" .hass="${this.hass}" .value="${this._config.consumo_entity}" .configValue=${"consumo_entity"} @value-changed="${this._valueChanged}"></ha-entity-picker>
        ` : html`
          <div class="label">Consumo Fittizio (kWh)</div>
          <input type="number" step="0.1" .value="${this._config.consumo_val !== undefined ? this._config.consumo_val : 0}" .configValue="${"consumo_val"}" @input="${this._valueChanged}" class="styled-input">
        `}

        <div class="section">2. Materia Prima</div>
        <div class="label">Tipo Tariffa</div>
        <select .value="${tipo}" .configValue="${"tipo_costo"}" @change="${this._valueChanged}" class="styled-select" style="margin-bottom: 10px;">
          <option value="mono">Monoraria</option>
          <option value="fasce">A Fasce (F1, F2, F3)</option>
        </select>

        ${tipo === 'mono' ? this._renderPriceEditor(1, 'Prezzo Materia Prima (€/kWh)') : html`
          ${this._renderPriceEditor(1, 'Fascia F1 (€/kWh)')}
          ${this._renderPriceEditor(2, 'Fascia F2 (€/kWh)')}
          ${this._renderPriceEditor(3, 'Fascia F3 (€/kWh)')}
        `}

        <div class="section">3. Costi Variabili Extra (€/kWh)</div>
        <div class="row">
          <div style="flex:1;"><div class="label">Spread Energia</div><input type="number" step="0.0001" .value="${this._config.spread !== undefined ? this._config.spread : 0}" .configValue="${"spread"}" @input="${this._valueChanged}" class="styled-input"></div>
          <div style="flex:1;"><div class="label">Costo Trasporto</div><input type="number" step="0.0001" .value="${this._config.trasporto !== undefined ? this._config.trasporto : 0}" .configValue="${"trasporto"}" @input="${this._valueChanged}" class="styled-input"></div>
        </div>
        <div class="row" style="margin-top: 10px;">
          <div style="flex:1;"><div class="label">Oneri di Sistema</div><input type="number" step="0.0001" .value="${this._config.oneri !== undefined ? this._config.oneri : 0}" .configValue="${"oneri"}" @input="${this._valueChanged}" class="styled-input"></div>
          <div style="flex:1;"><div class="label">Accise</div><input type="number" step="0.0001" .value="${this._config.accise !== undefined ? this._config.accise : 0}" .configValue="${"accise"}" @input="${this._valueChanged}" class="styled-input"></div>
        </div>

        <div class="section">4. Costi Fissi Mensili (€/mese)</div>
        <div class="row">
          <div style="flex:1;"><div class="label">Commercializzazione (PCV)</div><input type="number" step="0.01" .value="${this._config.pcv !== undefined ? this._config.pcv : 0}" .configValue="${"pcv"}" @input="${this._valueChanged}" class="styled-input"></div>
          <div style="flex:1;"><div class="label">Quota Fissa Rete/Oneri</div><input type="number" step="0.01" .value="${this._config.fissi_rete !== undefined ? this._config.fissi_rete : 0}" .configValue="${"fissi_rete"}" @input="${this._valueChanged}" class="styled-input"></div>
        </div>
        <div class="row" style="margin-top: 10px;">
          <div style="flex:1;">
            <div class="label">Potenza Contatore (kW)</div>
            <select .value="${this._config.contatore_kw || 3}" .configValue="${"contatore_kw"}" @change="${this._valueChanged}" class="styled-select">
              <option value="1.5">1.5 kW</option><option value="3">3 kW</option><option value="4.5">4.5 kW</option><option value="6">6 kW</option><option value="10">10 kW</option>
            </select>
          </div>
          <div style="flex:1;"><div class="label">Costo Potenza (€/kW/mese)</div><input type="number" step="0.01" .value="${this._config.prezzo_kw !== undefined ? this._config.prezzo_kw : 1.98}" .configValue="${"prezzo_kw"}" @input="${this._valueChanged}" class="styled-input"></div>
        </div>
        <div class="row" style="margin-top: 10px;">
          <div style="flex:1;"><div class="label">Canone TV/mese (Gen-Ott)</div><input type="number" step="0.01" .value="${this._config.canone_tv !== undefined ? this._config.canone_tv : 0}" .configValue="${"canone_tv"}" @input="${this._valueChanged}" class="styled-input"></div>
          <div style="flex:1;"></div>
        </div>

        <div class="section">5. Imposte e Perdite</div>
        <div class="row">
          <div style="flex:1;">
            <div class="label">IVA (%)</div>
            <select .value="${this._config.iva || 10}" .configValue="${"iva"}" @change="${this._valueChanged}" class="styled-select">
              <option value="10">IVA 10% (Domestico)</option><option value="22">IVA 22% (Altri Usi)</option>
            </select>
          </div>
          <div style="flex:1;"><div class="label">Perdite Rete (%)</div><input type="number" .value="${this._config.perdite_rete !== undefined ? this._config.perdite_rete : 10}" .configValue="${"perdite_rete"}" @input="${this._valueChanged}" class="styled-input"></div>
        </div>

        <div class="section">6. Bonus Sociale ARERA</div>
        <div class="row" style="align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div class="label" style="margin:0;">Abilita Bonus</div>
          <ha-switch .checked="${this._config.bonus_enabled}" .configValue="${"bonus_enabled"}" @change="${this._valueChanged}"></ha-switch>
        </div>
        ${this._config.bonus_enabled ? html`
          <div class="label">Valore Giornaliero Sconto (€/giorno)</div>
          <input type="number" step="0.0001" .value="${this._config.bonus_valore_giorno !== undefined ? this._config.bonus_valore_giorno : 0}" .configValue="${"bonus_valore_giorno"}" @input="${this._valueChanged}" class="styled-input">
        ` : ''}

        <div class="section">7. Sensori Storici (Opzionali)</div>
        <ha-entity-picker label="Consumo Giornaliero" .hass="${this.hass}" .value="${this._config.consumo_giornaliero_entity}" .configValue=${"consumo_giornaliero_entity"} @value-changed="${this._valueChanged}"></ha-entity-picker>
        <ha-entity-picker label="Consumo Settimanale" .hass="${this.hass}" .value="${this._config.consumo_settimanale_entity}" .configValue=${"consumo_settimanale_entity"} @value-changed="${this._valueChanged}"></ha-entity-picker>
        <ha-entity-picker label="Consumo Trimestrale" .hass="${this.hass}" .value="${this._config.consumo_trimestrale_entity}" .configValue=${"consumo_trimestrale_entity"} @value-changed="${this._valueChanged}"></ha-entity-picker>
        <ha-entity-picker label="Consumo Annuale" .hass="${this.hass}" .value="${this._config.consumo_annuale_entity}" .configValue=${"consumo_annuale_entity"} @value-changed="${this._valueChanged}"></ha-entity-picker>

      </div>
    `;
  }

  _renderPriceEditor(idx, label) {
    const modo = this._config['modo_p' + idx] || 'val';
    return html`
      <div class="price-box">
        <div class="label" style="margin-bottom: 5px;">${label}</div>
        <select .value="${modo}" .configValue="${'modo_p' + idx}" @change="${this._valueChanged}" class="styled-select small">
          <option value="val">Prezzo Fisso</option><option value="ent">Sensore (es. PUN)</option>
        </select>
        ${modo === 'ent' ? html`<ha-entity-picker .hass="${this.hass}" .value="${this._config['p' + idx + '_ent']}" .configValue=${'p' + idx + '_ent'} @value-changed="${this._valueChanged}"></ha-entity-picker>` : html`<input type="number" step="0.0001" .value="${this._config['p' + idx + '_val'] !== undefined ? this._config['p' + idx + '_val'] : 0}" .configValue="${'p' + idx + '_val'}" @input="${this._valueChanged}" class="styled-input small" style="margin-top: 5px;">`}
      </div>
    `;
  }

  static get styles() {
    return css`
      .card-config { padding: 10px; }
      .section { margin: 20px 0 10px; font-weight: bold; color: var(--primary-color); border-bottom: 1px solid var(--divider-color); text-transform: uppercase; font-size: 0.8rem; }
      .price-box { background: var(--secondary-background-color); padding: 10px; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--divider-color); }
      .row { display: flex; gap: 10px; }
      .label { font-size: 0.8rem; color: var(--secondary-text-color); margin-bottom: 5px; font-weight: bold; }
      .styled-select, .styled-input { width: 100%; padding: 8px; box-sizing: border-box; background: var(--card-background-color); color: var(--primary-text-color); border: 1px solid var(--divider-color); border-radius: 4px; font-family: inherit; }
      .styled-input:focus { outline: none; border-color: var(--primary-color); }
      .small { font-size: 0.8rem; padding: 6px; }
      ha-entity-picker { margin-bottom: 10px; display: block; }
    `;
  }
}
customElements.define('italy-energy-bill-card-editor', ItalyEnergyBillCardEditor);

// --- CARD PRINCIPALE ---
class ItalyEnergyBillCard extends LitElement {
  static get properties() {
    return { 
      hass: { type: Object }, 
      config: { type: Object },
      _showStats: { state: true }
    };
  }

  constructor() {
    super();
    this._showStats = false;
  }

  static getConfigElement() { return document.createElement("italy-energy-bill-card-editor"); }


  static getStubConfig() {
    return {
      title: "Costo Energia",
      tipo_costo: "mono",
      modo_consumo: "val",
      consumo_val: 150,
      p1_val: 0.10,
      spread: 0.015,
      pcv: 6.0,
      contatore_kw: 3,
      iva: 10,
      layout_compatto: false
    };
  }

  setConfig(config) {
    this.config = { title: "Costo Energia", tipo_costo: "mono", iva: 10, perdite_rete: 10, canone_tv: 0, contatore_kw: 3, prezzo_kw: 1.98, layout_compatto: false, bonus_enabled: false, bonus_valore_giorno: 0, ...config };
  }

  _toggleStats() {
    this._showStats = !this._showStats;
  }

  _getPrice(index) {
    const modo = this.config['modo_p' + index] || 'val';
    if (modo === 'ent') {
      const ent = this.config['p' + index + '_ent'];
      return (ent && this.hass.states[ent]) ? parseFloat(this.hass.states[ent].state) || 0 : 0;
    }
    return parseFloat(this.config['p' + index + '_val']) || 0;
  }

  _getHistoricalValue(entityId) {
    if (!entityId || !this.hass.states[entityId]) return '--';
    const val = parseFloat(this.hass.states[entityId].state);
    return isNaN(val) ? '--' : val.toFixed(1);
  }

  render() {
    if (!this.hass || !this.config) return html``;

    let consumo = 0;
    let consumoMesePrecedente = null;
    const mainEnt = this.hass.states[this.config.consumo_entity];
    
    if (this.config.modo_consumo === 'val') {
      consumo = parseFloat(this.config.consumo_val) || 0;
    } else {
      if (mainEnt) {
        consumo = parseFloat(mainEnt.state) || 0;
        if (mainEnt.attributes && mainEnt.attributes.last_period !== undefined) {
          consumoMesePrecedente = parseFloat(mainEnt.attributes.last_period);
        }
      }
    }

    const bonusAbilitato = this.config.bonus_enabled || false;
    const bonusGiorno = parseFloat(this.config.bonus_valore_giorno) || 0;
    const oggi = new Date();
    const giornoCorrente = oggi.getDate();
    const scontoBonusMaturato = bonusAbilitato ? (bonusGiorno * giornoCorrente) : 0;

    const hasHistoricalSensors = 
      this.config.consumo_giornaliero_entity || 
      this.config.consumo_settimanale_entity || 
      this.config.consumo_trimestrale_entity || 
      this.config.consumo_annuale_entity;

    const consGiornaliero = this._getHistoricalValue(this.config.consumo_giornaliero_entity);
    const consSettimanale = this._getHistoricalValue(this.config.consumo_settimanale_entity);
    const consTrimestrale = this._getHistoricalValue(this.config.consumo_trimestrale_entity);
    const consAnnuale = this._getHistoricalValue(this.config.consumo_annuale_entity);

    const isFasce = this.config.tipo_costo === 'fasce';
    const p1 = this._getPrice(1);
    const p2 = isFasce ? this._getPrice(2) : p1;
    const p3 = isFasce ? this._getPrice(3) : p1;
    let prezzoMP = isFasce ? (p1 + p2 + p3) / 3 : p1; 

    const spread = parseFloat(this.config.spread) || 0;
    const trasporto = parseFloat(this.config.trasporto) || 0;
    const oneri = parseFloat(this.config.oneri) || 0;
    const accise = parseFloat(this.config.accise) || 0;
    const totaleVariabiliExtra = spread + trasporto + oneri + accise;

    const pcv = parseFloat(this.config.pcv) || 0;
    const fissiRete = parseFloat(this.config.fissi_rete) || 0;
    const kw = parseFloat(this.config.contatore_kw) || 3;
    const prezzoKw = parseFloat(this.config.prezzo_kw) || 1.98;
    const quotaPotenza = kw * prezzoKw;
    const totaleFissi = pcv + quotaPotenza + fissiRete;
    
    const currentMonth = new Date().getMonth();
    let canoneTV = (currentMonth >= 0 && currentMonth <= 9) ? (parseFloat(this.config.canone_tv) || 0) : 0;

    const calcolaImponibileTotale = (kwh) => {
      const MP = kwh * prezzoMP;
      const perdite_rete = MP * (parseFloat(this.config.perdite_rete) / 100);
      const extra = kwh * totaleVariabiliExtra; 
      return MP + perdite_rete + extra + totaleFissi;
    };

    let costoMesePrecedente = '--';
    if (consumoMesePrecedente !== null && !isNaN(consumoMesePrecedente)) {
      costoMesePrecedente = (calcolaImponibileTotale(consumoMesePrecedente) * (1 + parseFloat(this.config.iva) / 100) + canoneTV).toFixed(2) + ' €';
    }

    const costoMP = consumo * prezzoMP;
    const costoMPPerdite = costoMP * (parseFloat(this.config.perdite_rete) / 100);
    const spesaEnergia = costoMP + costoMPPerdite + (consumo * spread) + pcv;
    const spesaTrasporto = (consumo * trasporto) + quotaPotenza + fissiRete;
    const spesaImposte = (consumo * accise) + (consumo * oneri);
    const imponibileAttuale = spesaEnergia + spesaTrasporto + spesaImposte;
    const quotaIva = imponibileAttuale * (parseFloat(this.config.iva) / 100);
    
    const totaleCorrenteOriginale = imponibileAttuale + quotaIva + canoneTV;
    const totaleCorrente = totaleCorrenteOriginale - scontoBonusMaturato;
    const costoMedioKwh = consumo > 0 ? ((imponibileAttuale + quotaIva) / consumo) : 0;

    const stimaCostoStorico = (valKwh) => {
      if (valKwh === '--' || isNaN(valKwh)) return '-- €';
      return (parseFloat(valKwh) * costoMedioKwh).toFixed(2) + ' €';
    };

    const percEnergia = imponibileAttuale > 0 ? (spesaEnergia / imponibileAttuale * 100) : 0;
    const percTrasporto = imponibileAttuale > 0 ? (spesaTrasporto / imponibileAttuale * 100) : 0;
    const percImposte = imponibileAttuale > 0 ? (spesaImposte / imponibileAttuale * 100) : 0;

    return html`
      <ha-card class="${this.config.layout_compatto ? 'compact-card' : ''}">
        ${this.config.layout_compatto ? html`
          <div class="compact-view" @click="${this._toggleStats}">
            <ha-icon icon="mdi:lightning-bolt" class="icon-main icon-animated"></ha-icon>
            <div class="compact-info">
              <span class="compact-title">${this.config.title}</span>
              <span class="compact-total">${totaleCorrente.toFixed(2)}€</span>
            </div>
            <div class="badge-compact">${prezzoMP.toFixed(4)} €/kWh</div>
          </div>
        ` : html`
          <div class="header">
            <div class="icon-title">
              <ha-icon icon="mdi:lightning-bolt" class="icon-main icon-animated"></ha-icon>
              <span>${this.config.title}</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="badge">${prezzoMP.toFixed(4)} €/kWh</div>
              <ha-icon icon="mdi:chart-box" class="stats-btn" @click="${this._toggleStats}" title="Vedi Statistiche"></ha-icon>
            </div>
          </div>

          <div class="card-content">
            <div class="main-cost">
              <span class="currency">€</span>
              <span class="value">${totaleCorrente.toFixed(2)}</span>
            </div>
            <div class="month-label">Stima costi correnti (IVA ${this.config.iva}% ${canoneTV > 0 ? '+ Canone' : ''})</div>
            
            <div class="divider"></div>

            ${isFasce ? html`
              <div class="info-grid">
                <div class="info-block"><div class="info-label"><span class="dot f1"></span>F1</div><div class="info-value">${p1.toFixed(4)}<span class="unit">€</span></div></div>
                <div class="info-block"><div class="info-label"><span class="dot f2"></span>F2</div><div class="info-value">${p2.toFixed(4)}<span class="unit">€</span></div></div>
                <div class="info-block"><div class="info-label"><span class="dot f3"></span>F3</div><div class="info-value">${p3.toFixed(4)}<span class="unit">€</span></div></div>
              </div>
            ` : html`
              <div class="info-grid">
                <div class="info-block"><div class="info-label">Consumo</div><div class="info-value">${consumo.toFixed(1)} <span class="unit">kWh</span></div></div>
                <div class="info-block"><div class="info-label">Tariffa</div><div class="info-value">Monoraria</div></div>
              </div>
            `}

            <div class="footer">
              <div class="footer-item"><ha-icon icon="mdi:cash-lock" class="icon-fissi"></ha-icon><span class="footer-text">Fissi: ${totaleFissi.toFixed(2)}€</span></div>
              <div class="footer-item"><ha-icon icon="mdi:chart-line" class="icon-spread"></ha-icon><span class="footer-text">Extra: +${totaleVariabiliExtra.toFixed(4)}</span></div>
            </div>

            ${bonusAbilitato ? html`
            <div class="footer" style="border-top: none; padding-top: 5px; margin-top: 5px;">
              <div class="footer-item" style="width: 100%; justify-content: center;">
                <ha-icon icon="mdi:hand-heart" style="color: #4caf50;"></ha-icon>
                <span class="footer-text" style="color: #4caf50; font-weight: bold;">Bonus ARERA: -${scontoBonusMaturato.toFixed(2)}€</span>
              </div>
            </div>
            ` : ''}
          </div>
        `}

        ${this._showStats ? html`
          <div class="stats-modal">
            <div class="stats-modal-content">
                <div class="stats-header">
                  <ha-icon icon="mdi:close" @click="${this._toggleStats}" class="close-btn"></ha-icon>
                  <span>Statistiche e Storico</span>
                </div>
                
                <div class="stats-section">
                <div class="stats-title"><ha-icon icon="mdi:history" class="section-icon"></ha-icon> Confronto Mesi</div>
                <div class="stats-grid grid-2">
                    <div class="stats-col">
                        <span>Mese Scorso (Lordo)</span>
                        <b style="font-size: 1.1rem; color: var(--secondary-text-color);">${costoMesePrecedente}</b>
                        <span style="margin-top: 2px;">(${consumoMesePrecedente !== null ? consumoMesePrecedente + ' kWh' : '--'})</span>
                    </div>
                    <div class="stats-col highlight">
                        <span>Mese Corrente</span>
                        <b style="font-size: 1.1rem;">${totaleCorrente.toFixed(2)} €</b>
                        <span style="margin-top: 2px; color: rgba(255,255,255,0.8);">(${consumo.toFixed(1)} kWh)</span>
                    </div>
                </div>
                </div>

                ${hasHistoricalSensors ? html`
                  <div class="stats-section">
                  <div class="stats-title"><ha-icon icon="mdi:calendar-clock" class="section-icon"></ha-icon> Storico Consumi e Stime</div>
                  <div class="stats-grid grid-4">
                      <div class="stats-col"><span>Oggi</span><b>${stimaCostoStorico(consGiornaliero)}</b><span class="small-unit">${consGiornaliero} kWh</span></div>
                      <div class="stats-col"><span>Settimana</span><b>${stimaCostoStorico(consSettimanale)}</b><span class="small-unit">${consSettimanale} kWh</span></div>
                      <div class="stats-col"><span>Trimestre</span><b>${stimaCostoStorico(consTrimestrale)}</b><span class="small-unit">${consTrimestrale} kWh</span></div>
                      <div class="stats-col"><span>Anno</span><b>${stimaCostoStorico(consAnnuale)}</b><span class="small-unit">${consAnnuale} kWh</span></div>
                  </div>
                  </div>
                ` : ''}

                <div class="stats-section">
                <div class="stats-title"><ha-icon icon="mdi:chart-pie" class="section-icon"></ha-icon> Ripartizione Percentuale Imponibile</div>
                <div class="stats-bars-container">
                    <div class="stats-bar-item">
                        <div class="stats-bar-label">⚡️ Spesa Energia <span class="perc">${percEnergia.toFixed(0)}%</span></div>
                        <div class="progress-bar-container"><div class="progress-bar progress-bar-animated f1-bar" style="width: ${percEnergia.toFixed(1)}%"></div></div>
                    </div>
                    <div class="stats-bar-item">
                        <div class="stats-bar-label">🚛 Trasporto e Fissi Rete <span class="perc">${percTrasporto.toFixed(0)}%</span></div>
                        <div class="progress-bar-container"><div class="progress-bar progress-bar-animated f2-bar" style="width: ${percTrasporto.toFixed(1)}%"></div></div>
                    </div>
                    <div class="stats-bar-item">
                        <div class="stats-bar-label">🏛 Imposte e Oneri <span class="perc">${percImposte.toFixed(0)}%</span></div>
                        <div class="progress-bar-container"><div class="progress-bar progress-bar-animated f3-bar" style="width: ${percImposte.toFixed(1)}%"></div></div>
                    </div>
                </div>
                </div>

                <div class="stats-section">
                <div class="stats-title"><ha-icon icon="mdi:calculator" class="section-icon"></ha-icon> Dettaglio Sconti e Indici</div>
                <div class="stats-grid grid-4">
                    <div class="stats-col"><span>Spread</span><b>${spread.toFixed(4)} €</b></div>
                    <div class="stats-col"><span>Commerc.</span><b>${pcv.toFixed(1)} €</b></div>
                    <div class="stats-col"><span>Mat. Prima</span><b>${prezzoMP.toFixed(3)} €</b></div>
                    <div class="stats-col highlight"><span>Costo kwh</span><b>${costoMedioKwh.toFixed(3)} €</b></div>
                </div>
                ${bonusAbilitato ? html`
                  <div class="stats-grid grid-1" style="margin-top: 10px;">
                    <div class="stats-col" style="border: 1px solid #4caf50; padding: 10px; align-items: center;">
                      <span style="margin:0; font-size: 0.7rem;">Sconto Bonus ARERA (maturato finora)</span>
                      <b style="color: #4caf50; font-size: 1.1rem;">-${scontoBonusMaturato.toFixed(2)} €</b>
                    </div>
                  </div>
                ` : ''}
                </div>

                <div class="disclaimer-stats" style="font-size: 0.7rem; color: var(--secondary-text-color); text-align: center; margin-top: 15px; font-style: italic; border-top: 1px solid var(--divider-color); padding-top: 10px;">
                  I dati storici si basano sui sensori "Utility Meter" di Home Assistant. Le stime dei periodi (Giorno/Settimana/Ecc.) sono calcolate in base al costo medio al kWh del mese in corso.
                </div>
            </div>
          </div>
        ` : ''}
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card { padding: 16px; border-radius: 12px; position: relative; overflow: hidden; }
      .compact-card { padding: 8px 12px !important; }
      
      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .icon-title { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: 600; }
      .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; background: var(--primary-color); color: white; font-weight: bold; }
      .badge-compact { padding: 4px 8px; border-radius: 20px; font-size: 0.75rem; background: var(--primary-color); color: white; font-weight: bold; }
      
      @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.08); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
      .icon-main { color: #FFD700; width: 24px; height: 24px; } 
      .icon-animated { animation: pulse 2s infinite ease-in-out; }
      .stats-btn { cursor: pointer; color: var(--secondary-text-color); transition: all 0.2s ease; }
      .stats-btn:hover { color: var(--primary-color); transform: translateY(-2px); }
      
      .icon-fissi { color: #4CAF50 !important; } 
      .icon-spread { color: #2196F3 !important; }
      
      .main-cost { display: flex; justify-content: center; align-items: flex-start; margin-top: 10px; }
      .currency { font-size: 1.5rem; margin-top: 10px; margin-right: 4px; color: inherit !important; }
      .value { font-size: 4rem; font-weight: 800; line-height: 1; color: inherit !important; }
      
      .month-label { text-align: center; color: var(--secondary-text-color); font-size: 0.8rem; margin-top: 5px; }
      .divider { height: 1px; background: var(--divider-color); margin: 20px 0; opacity: 0.4; }
      .info-grid { display: flex; justify-content: space-around; }
      .info-block { text-align: center; }
      .info-label { font-size: 0.7rem; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; color: var(--secondary-text-color); display: flex; align-items: center; justify-content: center; }
      .dot { width: 10px; height: 10px; display: inline-block; margin-right: 5px; border-radius: 2px; }
      .f1 { background-color: #fdd835; } .f2 { background-color: #ff9800; } .f3 { background-color: #4caf50; }
      .info-value { font-size: 1.1rem; font-weight: 600; }
      .footer { display: flex; justify-content: space-around; border-top: 1px solid var(--divider-color); padding-top: 15px; margin-top: 15px; }
      .footer-item { display: flex; align-items: center; gap: 6px; }
      .footer-text { font-size: 0.8rem; color: var(--secondary-text-color); }

      .compact-view { display: flex; align-items: center; gap: 12px; cursor: pointer; color: inherit !important; min-height: 40px; }
      .compact-info { flex: 1; display: flex; align-items: baseline; gap: 8px; }
      .compact-title { font-size: 0.95rem; font-weight: 500; color: inherit !important; white-space: nowrap; }
      .compact-total { font-size: 1.1rem; font-weight: bold; color: inherit !important; }

      .stats-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); z-index: 9999; display: flex; justify-content: center; align-items: center; }
      .stats-modal-content { background: var(--card-background-color); width: 90%; max-width: 500px; padding: 20px; border-radius: 16px; max-height: 85vh; overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
      .stats-header { display: flex; align-items: center; font-size: 1.1rem; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid var(--divider-color); padding-bottom: 10px; }
      .close-btn { cursor: pointer; margin-right: 10px; color: var(--secondary-text-color); }
      .stats-section { margin-bottom: 25px; }
      .section-icon { color: var(--primary-color); margin-right: 5px; }
      .stats-title { font-size: 0.85rem; font-weight: bold; display: flex; align-items: center; color: var(--primary-text-color); margin-bottom: 12px; text-transform: uppercase; }
      .stats-grid { display: grid; gap: 8px; }
      .grid-1 { grid-template-columns: 1fr; }
      .grid-4 { grid-template-columns: repeat(4, 1fr); }
      .grid-2 { grid-template-columns: repeat(2, 1fr); } 
      .stats-col { display: flex; flex-direction: column; align-items: center; text-align: center; background: var(--secondary-background-color); padding: 10px 4px; border-radius: 8px; }
      .stats-col span { font-size: 0.6rem; text-transform: uppercase; color: var(--secondary-text-color); margin-bottom: 4px; }
      .stats-col b { font-size: 0.85rem; }
      .small-unit { font-size: 0.65rem; color: var(--secondary-text-color); margin-top: 2px; }
      .stats-col.highlight { background: var(--primary-color); color: white; }
      .stats-col.highlight span { color: rgba(255,255,255,0.8); }
      .stats-bars-container { display: flex; flex-direction: column; gap: 18px; }
      .stats-bar-label { font-size: 0.75rem; color: var(--primary-text-color); display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 600; }
      .progress-bar-container { width: 100%; height: 8px; background-color: var(--secondary-background-color); border-radius: 4px; overflow: hidden; }
      .progress-bar { height: 100%; border-radius: 4px; transition: width 1s ease-in-out; }
      .f1-bar { background-color: #fdd835; } .f2-bar { background-color: #ff9800; } .f3-bar { background-color: #4caf50; }
    `;
  }
}

customElements.define('italy-energy-bill-card', ItalyEnergyBillCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "italy-energy-bill-card",
  name: "Card Bolletta",
  description: "Card per il calcolo dinamico del costo dell'energia elettrica in Italia.",
  preview: true
});