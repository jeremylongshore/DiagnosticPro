# Redirect examples for firebase.json
## Apex → www
{ "hosting": { "public":"public", "redirects":[{ "source":"/**", "destination":"https://www.diagnosticpro.io", "type":301 }] } }
## www → apex
{ "hosting": { "public":"public", "redirects":[{ "source":"/**", "destination":"https://diagnosticpro.io", "type":301 }] } }
