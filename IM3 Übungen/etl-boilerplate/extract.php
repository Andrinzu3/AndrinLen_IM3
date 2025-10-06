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

function fetchWeatherData()
{
    $url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=28.6214&longitude=77.2148&hourly=us_aqi,ozone,carbon_monoxide,carbon_dioxide,uv_index&ref=freepublicapis.com"; 

    // Initialisiert eine cURL-Sitzung
    $ch = curl_init($url);

    // Setzt Optionen
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);


    // Führt die cURL-Sitzung aus und erhält den Inhalt
    $response = curl_exec($ch);


    // Schließt die cURL-Sitzung
    curl_close($ch);
    pribnt_r($response);

    // Dekodiert die JSON-Antwort und gibt Daten zurück
    return json_decode($response, true);

}

// Gibt die Daten zurück, wenn dieses Skript eingebunden ist
echo "<pre>";
print_r(fetchWeatherData());
echo "</pre>";
return fetchWeatherData();