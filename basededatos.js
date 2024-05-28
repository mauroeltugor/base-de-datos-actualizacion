const mysql = require('mysql');
const util = require('util');
const wordPressDataBase = 'elquindiano';
const elQuindianoDataBase = 'elquindi_quindiano';

const elquindianoConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: wordPressDataBase
});

const elquindi_quindianoConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: elQuindianoDataBase
});

// Promisify the connection and query functions
elquindianoConnection.connect = util.promisify(elquindianoConnection.connect);
elquindianoConnection.query = util.promisify(elquindianoConnection.query);
elquindi_quindianoConnection.connect = util.promisify(elquindi_quindianoConnection.connect);
elquindi_quindianoConnection.query = util.promisify(elquindi_quindianoConnection.query);

const normalizeTitle = (title) => {
  return title.toLowerCase().trim();
}

const updateDatabase = async () => {
  try {
    await elquindianoConnection.connect();
    console.log('Conectado a la base de datos elquindiano');

    await elquindi_quindianoConnection.connect();
    console.log('Conectado a la base de datos elquindi_quindiano');

    const articlesFromElQuindiano = await elquindi_quindianoConnection.query("SELECT title AS titulo, article_id AS id_articulo FROM info_articles");
    const postsFromWordPress = await elquindianoConnection.query("SELECT post_title AS titulo, post_author AS id_columnista FROM wp_post");
    const articleInfoFromElQuindiano = await elquindi_quindianoConnection.query("SELECT id AS id_articulo, user_id AS escritor_id FROM articles");

    let matchedArticleTitle;//titulo de id repetido 
    let matchedArticleId; //id del articulo repetido 
    let matchedWriterId;//id del escritor 

    for (let article of articlesFromElQuindiano) {
      let matchingPost = postsFromWordPress.find((post) => normalizeTitle(article.titulo) === normalizeTitle(post.titulo));
      if (matchingPost) {
        matchedArticleTitle = article.titulo;
        matchedArticleId = article.id_articulo;

        let matchingArticleInfo = articleInfoFromElQuindiano.find((articleInfo) => articleInfo.id_articulo === matchedArticleId);
        if (matchingArticleInfo) {
          matchedWriterId = matchingArticleInfo.escritor_id;
          break; //se sale del bucle cuando captura el id
        }
      }
    }  


    //se cierran las conexiones a las bases de datos

    elquindianoConnection.end();
    console.log('Conexión a la base de datos elquindiano cerrada');

    elquindi_quindianoConnection.end();
    console.log('Conexión a la base de datos elquindi_quindiano cerrada');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateDatabase();
