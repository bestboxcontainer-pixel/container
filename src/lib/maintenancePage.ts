/**
 * Page d'attente servie pendant la maintenance.
 *
 * Volontairement une chaîne HTML autonome plutôt qu'une route Next : elle est
 * rendue depuis le proxy, avant tout routage. Aucune base, aucune traduction,
 * aucun composant — donc rien qui puisse tomber en même temps que ce qu'on est
 * en train de réparer. Les styles sont en ligne pour la même raison : la
 * feuille compilée peut très bien être ce qui manque.
 *
 * Le texte est en allemand, comme la boutique.
 */

const ROUGE = "#e3000e";

export const PAGE_MAINTENANCE = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Wartungsarbeiten — BBC Best Box Containerhandel e.K.</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #f5f5f5;
    color: #242424;
    font-family: "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
  }
  .carte {
    width: 100%;
    max-width: 520px;
    background: #ffffff;
    border-top: 4px solid ${ROUGE};
    border-radius: 4px;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
    padding: 48px 40px;
    text-align: center;
  }
  .marque {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: -0.01em;
    margin: 0 0 32px;
  }
  .marque span { color: ${ROUGE}; }
  h1 {
    font-size: 26px;
    font-weight: 700;
    margin: 0 0 16px;
  }
  p {
    margin: 0 0 16px;
    color: #555555;
  }
  p:last-child { margin-bottom: 0; }
  .contact {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #e6e6e6;
    font-size: 14px;
  }
  .contact a {
    color: ${ROUGE};
    text-decoration: none;
    font-weight: 700;
  }
  .contact a:hover { text-decoration: underline; }
  @media (max-width: 480px) {
    .carte { padding: 36px 24px; }
    h1 { font-size: 22px; }
  }
</style>
</head>
<body>
  <main class="carte">
    <p class="marque">BBC Best Box <span>Containerhandel e.K.</span></p>
    <h1>Wir sind gleich wieder für Sie da</h1>
    <p>Unser Shop wird gerade überarbeitet. In Kürze steht Ihnen das gesamte Sortiment wieder zur Verfügung.</p>
    <p>Vielen Dank für Ihr Verständnis.</p>
    <p class="contact">
      Fragen? Schreiben Sie uns an
      <a href="mailto:kontakt@bestbox-containerhandel.de">kontakt@bestbox-containerhandel.de</a>
    </p>
  </main>
</body>
</html>
`;
