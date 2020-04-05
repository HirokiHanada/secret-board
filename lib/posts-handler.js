'use strict';
const crypto = require('crypto'); //暗号化に関する関数を提供してるモジュール
const pug = require('pug');
const Cookies = require('cookies');
const moment = require('moment-timezone');
const util = require('./handler-util');
const Post = require('./post');
const trackingIdKey = 'tracking_id'; //Cookieの名前(キー名)としてtrackingIdKey
//const contents = []; データベースにより不要

function handle(req, res) { //reqはクライアントからのHTTPリクエストに関する情報、resはクライアントに送り返すHTTPの情報が格納されている。
    const cookies = new Cookies(req, res); //cookiesのAPIに合わせてcookiesオブジェクトの作成。requireだけだと使えないからここでいわゆる”new”してる？
    // addTrackingCookie(cookies);
    const trackingId = addTrackingCookie(cookies, req.user); //検証して新しく付与。（引数が増えているのは検証でユーザー情報を使うため）
  switch (req.method) {
    case 'GET': //一覧ページにアクセス
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8' //これから送るものの概要
      });
      //res.end(pug.renderFile('./views/posts.pug', { contents: contents })); //pugファイルを返すと共に第二引数のcontentsオブジェクトの中身をpugファイルに渡してる。
      Post.findAll({order:[['id', 'DESC']]}).then((posts) => { //DBから全てデータ取ってくる。それを変数postsに入れる。
        posts.forEach((post) => { //forEachは、配列の要素をひとつずつ取り出して、その一つの要素を受け取る無名関数を実行する。
          post.content = post.content.replace(/\+/g, ' ');
          //post.content = post.content.replace(/\n/g, '<br>'); //\nは改行を表すもので、それをbrタグに置換してる。
          post.formattedCreatedAt = moment(post.createdAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
        });
        res.end(pug.renderFile('./views/posts.pug', {
          posts: posts, //renderfile(今回はposts.pug)にpostsを渡す。
          user: req.user //req.userはbasic認証のライブラリが入れてくれる。認証するときってuser名入れるから。 
        }));
        console.info(
          `閲覧されました: user: ${req.user}, ` +
          // `trackingId: ${cookies.get(trackingIdKey) },` + //送られてきたのを使ってる
          `trackingId: ${trackingId},` + //検証されたトラッキングID
          `remoteAddress: ${req.connection.remoteAddress} ` //クライアントの IP アドレス
        );
      });
      break;
    case 'POST':
      let body = '';
      req.on('data', (chunk) => {
        body = body + chunk;
      }).on('end', () => {
        const decoded = decodeURIComponent(body);
        const content = decoded.split('content=')[1]; //内容がkey=valueの形式で渡されるため、フォームで設定したcontentというキー名の値を取得している。
        console.info('投稿されました: ' + content);
        // contents.push(content); //配列に要素を追加。 contents配列を利用しなくなったので不要。
        // console.info('投稿された全内容: ' + contents);
        Post.create({ //sequelizeのデータベース上にデータを作る（保存？）
            content: content,
            // trackingCookie: cookies.get(trackingIdKey),
            trackingCookie: trackingId, //検証されたもの
            postedBy: req.user
          }).then(() => { //データ保存が完了してから後ろの処理
            handleRedirectPosts(req, res);
          });
        });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

function handleDelete(req, res) {
  switch (req.method) {
    case 'POST':
      let body = [];
      req.on('data', (chunk) => {
        body = body + chunk; //以上は、POSTのデータを受け取り
      }).on('end', () => {
        const decoded = decodeURIComponent(body);
        const id = decoded.split('id=')[1]; //URIエンコードをデコードして、投稿のID(番号)を取得。)(post.jsに設定されてる)
        Post.findById(id).then((post) => { //PK=Primary Key=主キー（一つしかないやつ）。IDを使ってデータベースから投稿データを取得、それを変数postに入れる。
          if (req.user === post.postedBy || req.user === 'admin') {
            post.destroy().then(() => {
              handleRedirectPosts(req, res);
            });
          }
        });
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

// function addTrackingCookie(cookies) {
//   if (!cookies.get(trackingIdKey)) { //trackingIDがなかったら以下の処理で付与
//     const trackingId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER); // 0以上1未満のランダムな小数×マックス数字。Math.floor関数で小数点以下切り捨て。
//     const tomorrow = new Date(Date.now() + (1000 * 60 * 60 * 24)); //現在時刻＋24時間（有効期限が一日のため）
//     cookies.set(trackingIdKey, trackingId, { expires: tomorrow }); //キー名、値、有効期限(第三引数)の順にセット
//   }
// }

/**
* Cookieに含まれているトラッキングIDに異常がなければその値を返し、
* 存在しない場合や異常なものである場合には、再度作成しCookieに付与してその値を返す
* @param {Cookies} cookies
* @param {String} userName
* @return {String} トラッキングID
*/
function addTrackingCookie(cookies, userName) {
  const requestedTrackingId = cookies.get(trackingIdKey); //ユーザーから投稿されたトラッキングクッキー
  if (isValidTrackingId(requestedTrackingId, userName)) { //trueならそのまま、falseならelseへ進む。
    return requestedTrackingId;
  } else {
    const originalId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER); //新しく設定
    const tomorrow = new Date(Date.now() + (1000 * 60 * 60 * 24)); //有効期限設定
    const trackingId = originalId + '_' + createValidHash(originalId, userName); //「元々の ID」と「元のIDとユーザー名を利用して作られたハッシュ値」を組み合わせた値。
    cookies.set(trackingIdKey, trackingId, { expires: tomorrow });
    return trackingId;
  }
}

function isValidTrackingId(trackingId, userName) {
  if (!trackingId) {
    return false; //addTrackingcookieのelseに行き、新しく設定される。
  }
  const splitted = trackingId.split('_'); //上でできたtrackingIdを_で分割
  const originalId = splitted[0]; //分割したうちの前
  const requestedHash = splitted[1]; //分割のうちの後ろ
  return createValidHash(originalId, userName) === requestedHash; //リクエストされたハッシュ値と、サーバー内で生成されたハッシュ値が一緒ならおっけー
}

function createValidHash(originalId, userName) {
  const sha1sum = crypto.createHash('sha1'); //今回はsha1というアルゴリズムを使う
  sha1sum.update(originalId + userName); //()内をハッシュ化。このままでは文字列として返してくれない。
  return sha1sum.digest('hex'); //digest関数を使いhex（16進数で返す）を宣言することで文字列になる。
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, {
    'Location': '/posts' // /postsへのリダイレクト。
  });
  res.end();
}

module.exports = {
  handle,
  handleDelete
};