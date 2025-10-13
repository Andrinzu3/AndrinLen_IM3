<?php
declare(strict_types=1);

// Städte
$cities = [
    'Neu-Delhi' => [28.6139, 77.2090],
    'Kochi'     => [10.0158, 76.2990],
    'Bangalore' => [12.9716, 77.5946],
    'Shillong'  => [25.5760, 91.8825],
    'Raipur'    => [21.2381, 81.6337],
    'Hyderabad' => [17.3871, 78.4917],
    'Mumbai'    => [19.0728, 72.8826],
    'Kanpur'    => [26.4499, 80.3319],
];

function fetchAirQuality(float $lat, float $lon): array
{
    $url = 'https://air-quality-api.open-meteo.com/v1/air-quality?' . http_build_query([
        'latitude'  => $lat,
        'longitude' => $lon,
        'current'   => 'us_aqi,carbon_monoxide,ozone,pm2_5',
        'timezone'  => 'auto',
    ]);
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
    $res = curl_exec($ch);
    if ($res === false) { $e = curl_error($ch); curl_close($ch); throw new RuntimeException($e); }
    curl_close($ch);
    $data = json_decode($res, true);
    if (json_last_error() !== JSON_ERROR_NONE) { throw new RuntimeException(json_last_error_msg()); }
    return $data;
}

function fetchTomTomTraffic(float $lat, float $lon, string $key): array
{
    $base = 'https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json';
    $url  = $base . '?' . http_build_query([
        'point' => sprintf('%.6f,%.6f', $lat, $lon),
        'unit'  => 'KMPH',
        'key'   => $key,
    ]);
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
    $res = curl_exec($ch);
    if ($res === false) { $e = curl_error($ch); curl_close($ch); throw new RuntimeException($e); }
    curl_close($ch);
    $data = json_decode($res, true);
    if (json_last_error() !== JSON_ERROR_NONE) { throw new RuntimeException(json_last_error_msg()); }
    return $data;
}

function fetchAllCities(array $cities, string $tomtomKey): array
{
    $out = [];
    foreach ($cities as $name => [$lat, $lon]) {
        try {
            $out[$name] = [
                'latitude'    => $lat,
                'longitude'   => $lon,
                'air_quality' => fetchAirQuality($lat, $lon),
                'traffic'     => fetchTomTomTraffic($lat, $lon, $tomtomKey),
            ];
        } catch (Throwable $e) {
            $out[$name] = ['error' => $e->getMessage()];
        }
    }
    return $out;
}

// beim Einbinden sofort die Rohdaten liefern
require_once __DIR__ . '/config.php';
return fetchAllCities($cities, TOMTOM_KEY);


