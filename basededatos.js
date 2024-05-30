const { error } = require('console');
const mysql = require('mysql');
const util = require('util');
//const wordPressDataBase = 'wordpress';
//const elQuindianoDataBase ='production';
//const wordPressDataBase = 'elquindiano';
//const elQuindianoDataBase = 'elquindi_quindiano';

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
    console.log('Conectado a la base de datos wordpress');

    await elquindi_quindianoConnection.connect();
    console.log('Conectado a la base de datos elquindiano');

    const articlesFromElQuindiano = await elquindi_quindianoConnection.query("SELECT title AS titulo, article_id AS id_articulo FROM info_articles"); // info_articles (QUINDIANO)
    const articleInfoFromElQuindiano = await elquindi_quindianoConnection.query("SELECT id AS id_articulo, user_id AS escritor_id FROM articles"); // Articles (QUINDIANO)
    const usersInformation = await elquindi_quindianoConnection.query('SELECT id as writer_id, name as writer_name FROM users'); // USUARIOS (QUINDIANO)
    const postsFromWordPress = await elquindianoConnection.query("SELECT post_title AS titulo, post_author AS id_columnista FROM wp_posts"); // wp_post (WORDPRESS)

    let matchedArticleTitle; // Título del artículo coincidente
    let matchedArticleId; // ID del artículo coincidente
    let matchedWriterId; // ID del escritor
    let matchedWriterName; // Nombre del escritor
    let matchedWriterNewId; // ID del escritor en WordPress

    for (let article of articlesFromElQuindiano) {
      let matchingPost = postsFromWordPress.find((post) => normalizeTitle(article.titulo) === normalizeTitle(post.titulo)); // Consulta los otros artículos comparando el primero
      console.log("encontro la primera coincidencia");
      if (matchingPost) { // Obtiene el título y el id del artículo que coincide en la otra tabla de la otra base de datos
          matchedArticleTitle = article.titulo;
          matchedArticleId = article.id_articulo;

          let matchingArticleInfo = articleInfoFromElQuindiano.find((articleInfo) => articleInfo.id_articulo === matchedArticleId);
          if (matchingArticleInfo) {
              matchedWriterId = matchingArticleInfo.escritor_id; // Captura el id del escritor

              let matchingUserInfo = usersInformation.find((user) => user.writer_id === matchedWriterId); // Consulta nombres que coincidan
              if (matchingUserInfo) {
                  matchedWriterName = matchingUserInfo.writer_name;

                  // Hacer una consulta SQL para encontrar el usuario en WordPress con LIKE
                  const matchingUserNameResults = await elquindianoConnection.query("SELECT ID AS user_newId FROM wp_users WHERE display_name LIKE ?", [`%${matchedWriterName}%`]);
                  
                  if (matchingUserNameResults.length > 0) {
                    matchedWriterNewId = matchingUserNameResults[0].user_newId;
                          await elquindianoConnection.query("UPDATE wp_posts SET post_author = ? WHERE post_title = ?", [matchedWriterNewId, article.titulo]);
                          console.log(`Se ha actualizado el ID del escritor (${matchedWriterName}) para el artículo '${article.titulo}' en la base de datos '${wordPressDataBase}'.`);
                  }
              }
          }
      }
  }

    elquindianoConnection.end();
    console.log('Conexión a la base de datos elquindiano cerrada');

    elquindi_quindianoConnection.end();
    console.log('Conexión a la base de datos elquindi_quindiano cerrada');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const data = async () => {
  try {
    await elquindianoConnection.connect();
    console.log('Conectado a la base de datos elquindiano');

    await elquindi_quindianoConnection.connect();
    console.log('Conectado a la base de datos elquindi_quindiano');

    const articlesFromElQuindiano = await elquindi_quindianoConnection.query("SELECT title AS titulo, article_id AS id_articulo FROM info_articles"); // info_articles (QUINDIANO)
    const articleInfoFromElQuindiano = await elquindi_quindianoConnection.query("SELECT id AS id_articulo, user_id AS escritor_id FROM articles"); // Articles (QUINDIANO)
    const usersInformation = await elquindi_quindianoConnection.query('SELECT id as writer_id, name as writer_name FROM users'); // USUARIOS (QUINDIANO)
    const postsFromWordPress = await elquindianoConnection.query("SELECT post_title AS titulo, post_author AS id_columnista FROM wp_posts"); // wp_post (WORDPRESS)
    const usersFromWordPress = await elquindianoConnection.query("SELECT ID AS user_newId, display_name AS user_name FROM wp_users"); // wp_users (WORDPRESS)


    console.log(articlesFromElQuindiano);
    console.log(articleInfoFromElQuindiano);
    console.log(usersInformation);
    console.log("---------------------------------------------");
    console.log(postsFromWordPress);
    console.log(usersFromWordPress);

    elquindianoConnection.end();
    console.log('Conexión a la base de datos elquindiano cerrada');

    elquindi_quindianoConnection.end();
    console.log('Conexión a la base de datos elquindi_quindiano cerrada');
  } catch {
    console.error(error)
  }
}

////updateDatabase();
//data();