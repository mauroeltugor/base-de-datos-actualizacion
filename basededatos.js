const mysql = require('mysql');
const util = require('util');

const elquindianoConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'elquindiano'
});

const elquindi_quindianoConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'elquindi_quindiano'
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

    const rows1 = await elquindi_quindianoConnection.query("SELECT title AS titulo, author_id AS id_columnista FROM articles");
    const rows2 = await elquindianoConnection.query("SELECT post_title AS titulo, post_author AS id_columnista FROM wp_post");

    console.log(rows1);
    console.log(rows2);

    for (let row1 of rows1) {
      let match = rows2.find((row2) => normalizeTitle(row1.titulo) === normalizeTitle(row2.titulo));
      if (match) {
        await elquindianoConnection.query("UPDATE wp_post SET post_author = ? WHERE post_title = ?", [row1.id_columnista, match.titulo]);
        console.log(`Se ha actualizado el ID del columnista para el artículo '${match.titulo}' en la base de datos 'elquindi_quindiano'.`);
      }
    }   

    console.log(rows1);
    console.log(rows2);

    elquindianoConnection.end();
    console.log('Conexión a la base de datos elquindiano cerrada');

    elquindi_quindianoConnection.end();
    console.log('Conexión a la base de datos elquindi_quindiano cerrada');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateDatabase();