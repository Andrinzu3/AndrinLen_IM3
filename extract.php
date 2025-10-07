<?php

/* ============================================================================
   HANDLUNGSANWEISUNG (extract.php)
   1) Lade Konfiguration/Constants (API-URL, Parameter, ggf. Zeitzone).
   2) Baue die Request-URL (Query-Params sauber via http_build_query).
   3) Initialisiere cURL (curl_init) mit der Ziel-URL.
   4) Setze cURL-Optionen (RETURNTRANSFER, TIMEOUT, HTTP-Header, FOLLOWLOCATION).
   5) Führe Request aus (curl_exec) und prüfe Transportfehler (curl_error).
   6) Prüfe HTTP-Status & Content-Type (JSON erwartet), sonst früh abbrechen.
   7) Dekodiere JSON robust (json_decode(..., true)).
   8) Normalisiere/prüfe Felder (defensive Defaults, Typen casten).
   9) Gib die Rohdaten als PHP-Array ZURÜCK (kein echo) für den Transform-Schritt.
  10) Fehlerfälle: Exception/Fehlerobjekt nach oben reichen (kein HTML ausgeben).
   ============================================================================ */

<?php
function fetchWeatherData()
{
    // URLs und Schluessel
    $url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=28.6214&longitude=77.2148&current=us_aqi,ozone,carbon_monoxide,pm2_5&ref=freepublicapis.com"; 
    $TOMTOM_BASE = "https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json";
    $TOMTOM_KEY  = "s71P0oNOD3tfvv60YSqP69K64EDjZnvI";

    // cURL
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 8);

    $response = curl_exec($ch);
    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new Exception("cURL-Fehler: " . $error);
    }
    curl_close($ch);

    $data = json_decode($response, true);
    if ($data === null) {
        throw new Exception("Ungueltige JSON-Antwort von Open-Meteo");
    }
    return $data;
}

// Nur wenn direkt im Browser / CLI aufgerufen, nicht beim Einbinden:
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    header('Content-Type: application/json');
    echo json_encode(fetchWeatherData(), JSON_PRETTY_PRINT);
}
