const mysql = require('mysql');
const util = require('util');
const wordPressDataBase = 'wordpress';
const elQuindianoDataBase = 'production';

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

        const articlesFromElQuindiano = await elquindi_quindianoConnection.query("SELECT title AS titulo, article_id AS id_articulo FROM info_articles"); // info_articles (QUINDIANO)
        const articleInfoFromElQuindiano = await elquindi_quindianoConnection.query("SELECT id AS id_articulo, user_id AS escritor_id FROM articles"); // Articles (QUINDIANO)
        const usersInformation = await elquindi_quindianoConnection.query('SELECT id as writer_id, name as writer_name FROM users'); // USUARIOS (QUINDIANO)
        const postsFromWordPress = await elquindianoConnection.query("SELECT post_title AS titulo, post_author AS id_columnista FROM wp_post"); // wp_post (WORDPRESS)
        const usersFromWordPress = await elquindianoConnection.query("SELECT ID AS user_newId, display_name AS user_name FROM wp_users"); // wp_users (WORDPRESS)

        let matchedArticleTitle; // Título del artículo coincidente
        let matchedArticleId; // ID del artículo coincidente
        let matchedWriterId; // ID del escritor
        let matchedWriterName; // Nombre del escritor
        let matchedWriterNewId; // ID del escritor en WordPress

        for (let article of articlesFromElQuindiano) {
            let matchingPost = postsFromWordPress.find((post) => normalizeTitle(article.titulo) === normalizeTitle(post.titulo)); // Consulta los otros artículos comparando el primero
            if (matchingPost) { // Obtiene el título y el id del artículo que coincide en la otra tabla de la otra base de datos
                matchedArticleTitle = article.titulo;
                matchedArticleId = article.id_articulo;

                let matchingArticleInfo = articleInfoFromElQuindiano.find((articleInfo) => articleInfo.id_articulo === matchedArticleId);
                if (matchingArticleInfo) {
                    matchedWriterId = matchingArticleInfo.escritor_id; // Captura el id del escritor

                    let matchingUserInfo = usersInformation.find((user) => user.writer_id === matchedWriterId); // Consulta nombres que coincidan
                    if (matchingUserInfo) {
                        matchedWriterName = matchingUserInfo.writer_name;

                        let matchingUserName = usersFromWordPress.find((newUser) => newUser.user_name === matchedWriterName); // Compara nombres de autor para sacar el id
                        if (matchingUserName) {
                            matchedWriterNewId = matchingUserName.user_newId;

                            // Actualiza el post_author en la tabla wp_post de WordPress
                            await elquindianoConnection.query("UPDATE wp_post SET post_author = ? WHERE post_title = ?", [matchedWriterNewId, article.titulo]);
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