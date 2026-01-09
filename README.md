Projektbeschreibung: Smog Bahārat
Kurzbeschreibung (ca. 500 Zeichen)
Smog Bahārat ist eine interaktive Webanwendung, die den direkten Zusammenhang zwischen Luftqualität (AQI) und Verkehrsdichte in indischen Metropolen visualisiert. Auf einer dynamischen Karte zeigen pulsierende Indikatoren den aktuellen Belastungszustand von Städten wie Neu-Delhi oder Mumbai in Echtzeit an. Durch Klick auf eine Stadt erhalten Nutzer detaillierte Diagramme und aktuelle Messwerte. Ziel des Projekts ist es, abstrakte Umweltdaten durch ein modernes, dunkles UI-Design greifbar zu machen und ein Bewusstsein für die urbane Situation in Indien zu schaffen.

Entwicklungsprozess & Programmierung
Wie die Programmierung ablief
Wir haben an mehreren Dingen gleichzeitig gearbeitet. Während das Grundgerüst der Webseite mit HTML und CSS entstand, wurde parallel bereits die Datenbank aufgebaut und die Daten aufbereitet. So konnten wir früh sehen, wie Layout und Daten zusammen funktionieren. Gleichzeitig führte diese Arbeitsweise aber auch zu Abstimmungsproblemen.
Ein grösseres Thema war die Zusammenarbeit über GitHub. Da wir oft gleichzeitig am gleichen Code gearbeitet haben, kam es immer wieder zu Konflikten beim Zusammenführen der Änderungen. Teilweise mussten Anpassungen manuell korrigiert werden. Dadurch wurde uns klar, wie wichtig klare Absprachen und regelmässiges Synchronisieren des Codes sind.

Zusätzlich war die Arbeit mit Chart.js teilweise schwierig. Die Library bringt viele Voreinstellungen und Standardfunktionen mit, die nicht immer zu unseren Anforderungen passten. Diese zuerst zu verstehen und danach gezielt anzupassen, nahm viel Zeit in Anspruch und liess sich nicht immer sofort lösen. Dadurch wurde der Entwicklungsprozess stellenweise verlangsamt. Insgesamt kosteten vor allem die Koordination und der Umgang mit bestehenden Tools mehr Zeit als ursprünglich erwartet.

Insgesamt war die Programmierung stark von Ausprobieren, Testen und Nachjustieren geprägt. Viele Probleme zeigten sich erst im Zusammenspiel von Datenmenge, Layout und Gerätegrösse und konnten nur durch iterative Anpassungen gelöst werden.

Learnings
Während der Entwicklung konnten folgende Kernkompetenzen vertieft werden:
•  Arbeiten mit Live-Daten: Daten über Schnittstellen abrufen, verarbeiten und gezielt im Interface aktualisieren.
•  Diagramme und Visualisierung: Aufbau und Anpassung von Diagrammen mit Chart.js, inklusive Zeitachsen und responsiver Darstellung.
•  Strukturierter JavaScript-Code: Arbeiten mit Vanilla JavaScript ohne Frameworks und saubere Trennung von Logik und Darstellung.
•  Responsive Design: Anpassung der Webseite an verschiedene Bildschirmgrössen mit modernen CSS-Techniken.
•  Zustandsverwaltung: Verwalten von ausgewählten Städten, Tabs und Zeiträumen innerhalb einer einzelnen Anwendung.

Schwierigkeiten
•  Mobile Darstellung: Die grösste Herausforderung war es, das komplexe Desktop-Layout für kleine Bildschirme verständlich umzubauen.
•  Layout-Probleme: Auf sehr kleinen Geräten traten unerwartete Abstands- und Höhenprobleme auf, die durch gezielte CSS-Anpassungen behoben wurden.
•  Fehlende Daten: Teilweise lieferten die APIs unvollständige Werte, was zu Fehlern in den Diagrammen führte. Dieses Problem wurde durch Prüfungen und Platzhalter gelöst.
•  Performance der Diagramme: Diagramme mussten korrekt neu geladen werden, ohne dass alte Instanzen Probleme verursachten.

Benutzte Ressourcen & Technologien
•	Frontend: HTML5, CSS3 (Custom Properties / Variables), JavaScript (ES6+).
•	Bibliotheken: Chart.js, chartjs-adapter-date-fns.
•	Design & Assets: Google Fonts (Poppins), SVG-Icons, eigene Karten-Grafiken.
•	Tools: Visual Studio Code, Browser Developer Tools (Responsive Mode, Debugging).
•	Daten: Eigene API-Schnittstelle (im3.smogbharat.ch) zur Aggregation von Luftqualitäts- und Verkehrsdaten.
•	KI: Einsatz von KI-Tools zur Unterstützung beim Debugging, zur Ideenfindung, zur Code-Optimierung sowie bei der Strukturierung von JavaScript-Logik und Problemlösungen während der Entwicklung
