'use strict';
const postsHandler = require('./posts-handler');
const util = require('./handler-util');

function route(req, res) {
  switch (req.url) {
    case '/posts': ///posts のパスにアクセスがあった時
      postsHandler.handle(req, res); //内容をposts-handlerモジュールのhandle関数に行く。
      break;
    case '/posts?delete=1':
      postsHandler.handleDelete(req, res);
      break;
    case '/logout':
      util.handleLogout(req, res); //handler-util.jsのhandleLogout関数を実行
      break;
    case '/favicon.ico': //画像を返す関数
      util.handleFavicon(req, res);
      break;
    default:
      util.handleNotFound(req, res);
      break;
  }
}

module.exports = {
  route //こうすることでroute関数をindex.jsからも使えるようになる。だからexports!
};