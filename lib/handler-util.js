'use strict';
const fs = require('fs'); //faviconで画像ファイルを読み込む用。

function handleLogout(req, res) {
  res.writeHead(401, { //ステータスコード 401 - Unauthorizedを返す。chromeのバグ→https://bugs.chromium.org/p/chromium/issues/detail?id=1034468
    //'Content-Type': 'text/plain; charset=utf-8'
    'Content-Type': 'text/html; charset=utf-8' //テキストではなく、HTMLを返すように変更することで、以下の処理で/postsへ移動できる「ログイン」リンクにつながる。
  });
  // res.end('ログアウトしました');
  res.end('<!DOCTYPE html><html lang="ja"><body>' +
    '<h1>ログアウトしました</h1>' +
    '<a href="/posts">ログイン</a>' +
    '</body></html>'
  );
}

function handleNotFound(req, res){
  res.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('ページがみつかりません');
}

function handleBadRequest(req, res){
  res.writeHead(400, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('未対応のメソッドです');
}

function handleFavicon(req, res) {
  res.writeHead(200, {
    'Content-Type': 'image/vnd.microsoft.icon' //アイコンデータをこれから返すよー
  });
  const favicon = fs.readFileSync('./favicon.ico');
  res.end(favicon);
}

module.exports = {
  handleLogout,
  handleNotFound,
  handleBadRequest,
  handleFavicon
};