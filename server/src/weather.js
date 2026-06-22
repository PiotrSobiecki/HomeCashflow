/**
 * Dostawca pogody (deep module) — granica między automatyką a zewnętrznym API.
 *
 * FAZA 1 (walking skeleton): brak realnego źródła — zwraca null, więc runner termostatu
 * niczego nie przełącza w produkcji (ścieżkę cron→Tuya udowadnia test integracyjny ze
 * wstrzykniętą temperaturą). FAZA 2 (#50): tu wejdzie realny odczyt z Open-Meteo
 * (bieżąca temperatura 2 m dla lat/lon, bez klucza API).
 *
 * @param {{ lat:number, lon:number }} coords
 * @returns {Promise<number|null>} temperatura w °C lub null gdy brak danych
 */
export async function getOutdoorTemp(_coords) {
  return null
}
