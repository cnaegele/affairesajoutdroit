// Cas 1: Chaîne uniquement de chiffres, ne commençant pas par 0
function isNumericNotStartingWithZero(str: string): boolean {
  const regex = /^[1-9]\d*$/;
  return regex.test(str);
}

// Cas 2: Commence par une lettre, contient lettres/underscore, avec au moins un chiffre
function isAlphanumericWithDigit(str: string): boolean {
  const regex = /^[A-Za-z][A-Za-z_]*\d[A-Za-z_\d]*$/;
  return regex.test(str);
}

// Fonction principale de détection
function detectStringType(str: string): 'id' | 'login' | 'nom' {
  if (isNumericNotStartingWithZero(str)) {
    return 'id';
  }
  if (isAlphanumericWithDigit(str)) {
    return 'login';
  }
  return 'nom';
}

// Export des fonctions
export { detectStringType };