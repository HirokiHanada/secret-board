'use strict';
const pug = require('pug'); 
const assert = require('assert'); //Node.js のテストのモジュール

// pug のテンプレートにおける XSS 脆弱性のテスト
const html = pug.renderFile('./views/posts.pug', { //まずこれをhtmlに変換する。posts.pugのテスト。第二引数下の情報は一時的に渡される。
  posts: [{ //サンプル投稿データ 下は配列の中身
    id: 1,
    content: '<script>alert(\'test\');</script>',
    postedBy: 'guest1',
    trackingCookie: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }],
  user: 'guest1' //アクセスユーザー
});

// スクリプトタグがエスケープされて含まれていることをチェック
assert(html.includes('&lt;script&gt;alert(\'test\');&lt;/script&gt;')); //htmlの中にこのような文章があるかというテスト
//< は &lt; 、> は &gt;。上のコードはちゃんとエスケープされてるかの確認。
console.log('テストが正常に完了しました'); //成功した時だけ表示