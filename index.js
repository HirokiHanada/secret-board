'use strict';
const http = require('http');
const auth = require('http-auth'); //公式ドキュメントに書いてあるやり方。
const router = require('./lib/router');
const basic = auth.basic({ //Basic認証。
  realm: 'Enter username and password.',
  file: './users.htpasswd'
});

const server = http.createServer(basic, (req, res) => { //serverオブジェクトを作ってる
  router.route(req, res); //routerというモジュールのroute関数を呼べば、必要なリクエストの振り分け処理を行ってくれる。（ここで、処理が、router.is内へ行く。）
}).on('error', (e) => {
  console.error('Server Error', e);
}).on('clientError', (e) => {
  console.error('Client Error', e);
});

const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.info('Listening on ' + port);
});