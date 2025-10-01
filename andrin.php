<?php

// -> Variable definieren

$name = "Andrin";
echo $name;

echo '<br';

$a = 292;
$b = 22;
echo $a + $b;

?>

// -> funktionen

<h1> Hallo <?php echo $name ?> </h1>

<?php
// Funktion definieren
function multiply($a, $b) {
    return $a * $b;
}

// Funktion aufrufen
echo multiply(5, 3);  // Ausgabe: 15
?>

// -> Bedingungen

<?php
$note = 3.75;

if ($note >= 4) {
    echo "Bestanden";
} elseif ($note >= 3.5) {
    echo "Nachprüfung";
} else {
    echo "Nicht bestanden";
}

// -> arrays

$banane = ['gelbe banane', 'grüne banane', 'braune banane'];
echo '<pre>';
print_r($banane);
echo '</pre>';

// -> assoziative arrays

$standorte = [
    'chur' => 16.4,
    'zürich' => 20.3,
    'st.galle ' => 18.7
];



