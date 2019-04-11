const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const mysql = require('mysql');
__dirname = path.resolve();


//conexão com o banco
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'papelaria',
  port: '3306'
});

//teste conexão
connection.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

//session para o login
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

//body Parser para pegar dados dos formularios
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('html', require('ejs').renderFile);

//static para todas os arquivos html terem acesso ao css
app.use(express.static('views'));

//retorna pagina inicial do site (login)
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, '/views/login.html'));
});

//recebe os valores dos campos de login e autentica para saber se o usuario esta cadastrado
app.post("/auth", function (req, res) {
  var user_name = req.body.user;
  var password = req.body.password;
  if (user_name && password) {
    connection.query('SELECT * FROM usuario WHERE Nome = ? AND Senha = ?', [user_name, password], function (error, results, fields) {
      if (results.length > 0) {
        req.session.loggedin = true;
        req.session.user_name = user_name;
        res.redirect('/home');
      } else {
        res.send('Nome ou Senha incorretos!');
      }
      res.end();
    });
  } else {
    res.send('Por favor, entre com seu nome e senha');
    res.end();
  }
});

//exibe pagina de cadastro de usuario
app.get("/cadastro_usuario", function (req, res) {
  res.sendFile(path.join(__dirname, '/views/cadastro_usuario.html'));
})

//recebe dados do formulário de cadastro
app.post("/cad_usuario", function (req, res) {
  var user_name = req.body.user;
  var password = req.body.password;
  const newusuario = { 'Nome': user_name, 'Senha': password };
  connection.query('INSERT INTO usuario SET ?', newusuario, (err, resp) => {
    if (err) {
      console.log('error', err.message, err.stack)
    }
    else
      console.log('ID do ultimo usuario inserido:', resp.insertId);
    res.redirect(path.join(__dirname, '/views/home.html'));
  });

});

//retorna pagina home do site
app.get("/home", function (req, res) {
  connection.query('SELECT * FROM `produto`', function (err, rows, fields) {
    if (err) {
      console.log('error', err.message, err.stack)
    }
    else {
      res.sendFile(__dirname + '/views/home.html', { produtos: rows })
    }
  });
});

//retorna pagina de cadastro de produto
app.get("/cadastro", function (req, res) {
  res.sendFile(path.join(__dirname, '/views/cadastro.html'));
})

//recebe dados do formulario e cadastra produtos
app.post('/cadastrar', function (request, res) {
  var nomeproduto = request.body.nomeproduto;
  var preco = request.body.preco;
  var qtd_estoque = request.body.qtd_estoque;
  const produto = { 'nomeproduto': nomeproduto, 'preco': preco, 'qtd_estoque': qtd_estoque };
  connection.query('INSERT INTO produto SET ?', produto, (err, resp) => {
    if (err) {
      console.log('error', err.message, err.stack)
    }
    else
      console.log('ID do ultimo inserido:', resp.insertId);
    res.render(__dirname + '/views/cadastro.html');
  });
});

//retorna pagina para pesquisar produto
app.get("/consultar", function (req, res) {
  res.sendFile(path.join(__dirname, '/views/consultar.html'));
})

app.post("/consultar", function (req, res) {
  var nome_pesquisa_produto = req.body.nome_pesquisa_produto;
  const pesquisa_produto = { 'nomeproduto': nome_pesquisa_produto };
  connection.query('SELECT * FROM `produto` Where nomeproduto = ?', pesquisa_produto, (err, rows, resp) => {
    if (err) {
      console.log('error', err.message, err.stack)
    }
    else
      console.log('ID do ultimo inserido:', resp.insertId);
    res.render(__dirname + '/views/consultar.html', { produtos: rows });
  });
});

//retorna pagina para deletar produto
app.get("/deletar", function (req, res) {

  res.sendFile(path.join(__dirname, '/views/deletar.html'));
})

app.post("/deletar", function (req, res) {
  var id_deletar_produto = req.body.id_deletar_produto;
  connection.query('DELETE FROM `produto` WHERE (`Id_produto` = ?)', [id_deletar_produto],
    (err, result) => {
      if (err) {
        console.log('error', err.message, err.stack)
      }
      else
        res.render(__dirname + '/views/deletar.html');
    });
});

//retorna pagina para atualizar produto
app.get("/atualizar", function (req, res) {
  res.sendFile(path.join(__dirname, '/views/atualizar.html'));
})

app.post('/atualizar', function (req, res) {
  var id_produto = req.body.id_produto;
  var nomeproduto = req.body.nomeproduto;
  var preco = req.body.preco;
  var qtd_estoque = req.body.qtd_estoque;
  connection.query(
    'UPDATE produto SET nomeproduto = ?, preco = ?, qtd_estoque = ? Where id_produto = ?', [nomeproduto, preco, qtd_estoque, id_produto],
    (err, result) => {
      if (err) throw err;
      console.log(`Atualizado ${result.changedRows} row(s)`);
    });
  res.redirect('/home');
});

//define porta de saida do node.js
app.listen(8081, function () { console.log("Servidor esta rodando!") });