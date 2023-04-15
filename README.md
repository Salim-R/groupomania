#   Groupomania x one piece 

- renommer le dossier "groupomania" par "p7" dans lequel vous créerez d'abord un dossier backend où vous placerez la totalité des fichiers/dossiers hormis le fichier "readme.md" et le dossier "frontend".
- Puis a l'aide de "npm i" installer les dépendances du dossier front et du dossier back: 
 - cd frontend / cd backend depuis le p7.
 

Ensuite il va falloir importer les .json users et posts sur mongo grace à mongo atlas vous pourrez ensuite acceder au differentes données du site:
- Vous devriez normalement avoir post avec deux sous-partie users et posts


## config :

-   Mettez vos informations de cluster dans  `/config/db.js`
-   Créez le fichier  `.env`  dans  `backend`  dans les données suivantes
    -   PORT=5000  `votre port localhost`
    -   CLIENT_URL= 'http://localhost:3000' `votre URL client`
    -   DB_USERNAME/DB_PASSWORD= `votre identifiant et mot de passe`
    - "  `votre clé secrète aléatoire`

----------

Front config :

-   Créez un fichier  `.env`  dans le dossier frontend :
    -   REACT_APP_API_URL=http://localhost:5000/`l'url de votre serveur`

-------

React / Express / MongoDB / Redux

Démarrer le server :  `cd backend` +`npm start`

Démarrer le front :  `cd frontend`  +  `npm start`

