const mongoose = require("mongoose");
mongoose.set('strictQuery', false);
require('dotenv').config({ path: '.env' });

// connexion a MongoAtlas
mongoose.connect(`mongodb+srv://Salim:${process.env.REACT_APP_DB_PASSWORD}@atlascluster.pbtvn.mongodb.net/?retryWrites=true&w=majority&appName=AtlasCluster`,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

