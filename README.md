#   Groupomania x one piece 

- Créer d'abord un dossier p7 dans lequel vous créerez un dossier backend contenant la totalité des fichiers hormis le readme.md et le dossier frontend.
- Puis a l'aide de npm i installer les dépendances du dossier front et du dossier back: 
 - cd frontend / cd backend depuis le p7.

Ensuite il va falloir importer les .json users et posts sur mongo grace à mongo atlas vous pourrez ensuite acceder au differentes données du site:
- Vous devriez normalement avoir post avec deux sous-partie users et posts


## config :

-   Mettez vos informations de cluster dans  `/config/db.js`
-   Créez le fichier  `.env`  dans  `backend`  dans les données suivantes
    -   PORT=5000  `votre port localhost`
    -   CLIENT_URL= 'http://localhost:3000' `votre URL client`
    -   DB_USERNAME/DB_PASSWORD= `votre identifiant et mot de passe` ici Salim / limsalimsa84
    - TOKEN_SECRET="=^922WEfD6T8:cUY8e$7<f4,_!PW$]8z.%J38s3g8C4y4e*bUm4]nrwU4E5m^g@=G|pBW&.;9z3c[g9w_WxGN5P&2s2K#BxAjD6W"  `votre clé secrète aléatoire`

----------

Front config :

-   Créez un fichier  `.env`  dans le dossier frontend :
    -   REACT_APP_API_URL=http://localhost:5000/`l'url de votre serveur`

-------

React / Express / MongoDB / Redux

Démarrer le server :  `cd backend` +`npm start`

Démarrer le front :  `cd frontend`  +  `npm start`

