const getErrorMessage = (err, field, message) => {
  if (err.message && err.message.includes(field)) return message;
  return '';
};

const getDuplicateErrorMessage = (err, field, message) => {
  if (err.code === 11000 && Object.keys(err.keyValue)[0].includes(field)) return message;
  return '';
};

module.exports.signUpErrors = (err) => {
  const errors = { pseudo: '', email: '', password: '' };

  errors.pseudo =
    getErrorMessage(err, 'pseudo', 'Pseudo incorrect ou déjà pris') ||
    getDuplicateErrorMessage(err, 'pseudo', 'Ce pseudo est déjà pris');

  errors.email =
    getErrorMessage(err, 'email', 'Email incorrect') ||
    getDuplicateErrorMessage(err, 'email', 'Cet email est déjà enregistré');

  errors.password = getErrorMessage(
    err,
    'password',
    'Le mot de passe doit faire 6 caractères minimum'
  );

  return errors;
};

module.exports.signInErrors = (err) => {
  const errors = { email: '', password: '' };

  errors.email = getErrorMessage(err, 'incorrect email', 'Email inconnu');
  errors.password = getErrorMessage(err, 'incorrect password', 'Le mot de passe ne correspond pas');

  return errors;
};

module.exports.uploadErrors = (err) => {
  const errors = { format: '', maxSize: '' };

  errors.format = getErrorMessage(err, 'invalid file', 'Format incompatible : JPEG, PNG ou WebP attendu');
  // Le message annonçait 500 ko alors que la limite appliquée est de 5 Mo.
  errors.maxSize = getErrorMessage(err, 'max size', 'Le fichier dépasse 5 Mo');

  return errors;
};
