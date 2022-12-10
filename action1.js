//[1]変数、配列を宣言する場所

//[1-1]マップデータ
var mapdata = new Array(10);
for (var y = 0; y < 10; y++) mapdata[y] = new Array(150);


//[1-2]１パネルの大きさ
var SIZE = 72;

//[1-3]画面の位置の値
var scroll = 0;   //ここの初期値を０にしないとクラッシュする。初期値大事。恐らく一番最初に使用する時に数字で計算するから


//[1-4]魔法少女のデータ
var plX = 108;                       //魔法処女の中心X座標
var plY =  36;                       //魔法処女の中心Y座標
var plXp = 0;
var plYp = 0;
var plJump = 2;
var CXP = [-28,  27, -28, 27];       //四隅の場所。左上、右上、左下、右下の順
var CYP = [-36, -36,  35, 35];
var plDir = 0;
var plAni = 0;
var MG_ANIMA = [0, 0, 1, 1, 0, 0, 2, 2];


//[1-5]壁の定義
var WALL = [0, 1, 1, 0, 0, 0, 0];

//[1-6]ゲームを進行させるための変数
var idx = 0;
var tmr = 0;
var stage = 1;
var score = 0;
var gtime = 0;



//[2]関数を宣言する場所
function setStage() {
  var i, n, x, y;
  for (y = 0; y < 10; y++) {
    for (x = 0; x < 150; x++) {
      mapdata[y][x] = 0;    //データを初期化
    }
  }
  n = 21 - stage;     //最下段の地面の幅
  if (n < 6) n = 6;   //最も短くなると６マス
  for (x = 0; x < 150; x++) {   //穴を作る処理
    if (x%20 < n) {
      mapdata[9][x] = 1;          //下段に壁（地面）を敷く
      if (stage%2 == 0 && x > 20 && x%4 == 0 && rnd(100) < 5*stage) mapdata[8][x] = 3;  //針
    }
  }
  for (i = 1; i < 9; i++) {   //パールを書く処理。ブロックに上書きされてしまうのは仕様。
    x = 15*i + rnd(15);       //ランダムに置くだけだと偏りが生まれてしまうので１５ずつ間隔を空けてからランダムに０～１４までを足す
    y = 1 + rnd(7);
    mapdata[y][x] = 5;
    mapdata[y-1][x] = 5;
    mapdata[y+1][x] = 5;
    mapdata[y][x-1] = 5;
    mapdata[y][x+1] = 5;
  }
  x = 14;
  y = 8;
  n = 5;
  do {    //ランダムにブロックを配置する
    for (i = 0; i < n; i++) {
      mapdata[y][x] = 2;
      if (x > 20 && x%3 == 0 && rnd(100) < 5*stage) mapdata[y-1][x] = 4;  //食虫植物
      x++;
    }
    y = 2 + rnd(7);
    n = 2 + rnd(3);
  } while (x < 140);

  mapdata[8][149] = 6;      //ゴールにクリスタルを配置する
}


function drawGame() {
  var c, x, y, cx, cy;
  var cl = int(scroll / SIZE);//一マス進むごとにmapdataのｘの値を増やす。
  var ofsx = scroll % SIZE;//０～７１までをとる。マスの表示を少しずつずらしていく。７２になると０に戻る。その後clが増えるので次のマスに移動する。
  drawImg(0, 0, 0);
  for (y = 0; y < 10; y++) {
    //下記のＸが１５までだとぴったしになってしまう。最初はいいがスクロールすると１５パネル目までしか描画していないので少し隙間が生まれる。なので余分に１パネル描画しておくことでスクロールに対応する。
    for (x = 0; x < 16; x++) {
      c = mapdata[y][x + cl];
      if (c == 4 && tmr%30 < 15) {
        drawImgLR(c, x*SIZE - ofsx, y*SIZE);
        continue;
      }
      if (c > 0) drawImg(c, x*SIZE - ofsx, y*SIZE);   //段々左にスクロールしていきofsxが０になると元の場所に戻る。しかしcによって描画している配列自体が一つ移動しているので結果的に移動していることになる
    }
  }
  cx = plX - scroll;
  cy = plY;
  //スクロールする座標を管理する変数の値を計算
  if (cx < SIZE*5) {
    scroll = plX - SIZE*5;
    if (scroll < 0) scroll = 0;
  }
  if (cx > SIZE*10) {
    scroll = plX - SIZE*10;
    if (scroll > SIZE*135) scroll = SIZE*135;
  }
  if (idx == 3) {
    drawImgC(14 + int(tmr/10)%2, cx, cy);
    if (plY > 680) plY -= 2;
  }
  else if (idx > 0) {
    if (plDir == -1) drawImgLR(11 + MG_ANIMA[plAni%8], cx - SIZE/2, cy - SIZE/2);
    if (plDir ==  0) drawImg(10, cx - SIZE/2, cy - SIZE/2);
    if (plDir ==  1) drawImg(11 + MG_ANIMA[plAni%8], cx - SIZE/2, cy - SIZE/2);
  }
}


function chkWall(cx, cy) {
  var c = 0;                                          //偽（０）の時は壁がない。真（１）の時は壁がある。
  if (cx < 0 || 150*SIZE < cx) c++;                   //左端に出たら衝突判定で移動しない
  for (var i = 0; i < 4; i++) {                       //四隅の分まで
    var x = int((cx+CXP[i]) / SIZE);                  //７２よりも大きくなるごとに値が１づつ上がる１４４より大きいと２になる
    var y = int((cy+CYP[i]) / SIZE);
    if (0 <= x && x <= 149 && 0 <= y && y <= 9) {     //画面の高さと幅の範囲内なら
      if (WALL[mapdata[y][x]] == 1) c++;              //１にして真にすると座標を進めない
    }
  }
  return c;
}


function movePlayer() {

  //x軸方向の移動
  if (key[37] > 0) {        //左キー押されたら
    if (plXp > -32) plXp -= 2;
    plDir = -1;
    plAni++;
  }
  else if (key[39] > 0) {   //右キーが押されたら
    if (plXp < 32) plXp += 2;
    plDir = 1;
    plAni++;
  }
  else {
    plXp = int(plXp*0.7); //plxpを段々減らす
  }

  //壁にめり込まない限りX座標を変化させる
  var lr = Math.sign(plXp);
  var loop = Math.abs(plXp);
  while (loop > 0) {
    if (chkWall(plX + lr, plY) != 0) {
      plXp = 0;
      break;
    }
    plX += lr;
    loop--;
  }
  
  //y軸方向の移動
  if (plJump == 0) {                    //plJump ０＝地面に設置、１＝ジャンプ中、２＝落下中
    if (chkWall(plX, plY + 1) == 0) {   //自分のしたのマスが壁（地面）じゃないなら落下変数にする
      plJump = 2;
    }
    else if (key[32] == 1) {     //エンターキーが押されたらジャンプ変数にする。落下とジャンプが同時に起きないように分けている
      plYp = -60;
      plJump = 1;
    }
  }
  else if (plJump == 1) {
    if (key[32] > 0) 
        plYp += 6 ;
    else
        plYp += 18;

    if (plYp > 0) plJump = 2;
  }
  else {        //落下中
    if (key[32] > 0)
        plYp += 6;
    else
        plYp += 12;
    if (plYp > 48) plYp = 48;     //速度制限
  }

  //壁にめり込まない限りY座標を変化させる
  var ud = Math.sign(plYp);
  loop = Math.abs(plYp);
  while (loop > 0){
    if (chkWall(plX, plY + ud) != 0) {
      plYp = 0;
      if (plJump == 1) {
        plJump = 2;
      }
      else if (plJump == 2) {
        plJump = 0;
        if (key[32] == 1) key[32] = 2;
      }
      break;
    }
    plY += ud;
    loop--;
  }

  //魔法少女の位置に何があるか調べる
  var cx = int(plX/SIZE);
  var cy = int(plY/SIZE);
  var chip = 0;
  if (0 <= cx && cx < 150 && 0 <= cy && cy < 9) chip = mapdata[cy][cx];
  if (chip == 3 || chip == 4) return -1;  //敵に触れる
  if (chip == 5) {
    mapdata[cy][cx] = 0;
    score += 100;
    gtime += 20;
    playSE(2);
  }
  if (plY > 800) return -1;
  if (plX > SIZE*149) return 1; //ゴールした
  return 0;
}

function initVar() {
  plX = SIZE*2;
  plY = int(SIZE*8.5);  //ここの値を０にするとキャラクターが上から落ちてくる
  plXp = 0;
  plYp = 0;
  plJump = 0;
  plDir = 0;
  plAni = 0;
  gtime = 1200;
}


//[3]


//起動時の処理
function setup() {
  canvasSize(1080, 720);
  loadImg(0, "image/bg.png");
  for (var i = 1; i <= 6; i++) loadImg(i, "image/chip" + i + ".png");
  for (var i = 0; i <= 5; i++) loadImg(10 + i, "image/mgirl" + i + ".png");
  loadImg(20, "image/mg_illust.png");
  loadImg(21, "image/title.png");
  var SOUND = ["bgm", "jump", "pearl", "clear", "miss", "gameover"];
  for (var i = 0; i < SOUND.length; i++) loadSound(i, "sound/" + SOUND[i] + ".m4a");
  setStage();
}

//メインループ
function mainloop() {
  tmr++;  //タイマー用の変数を常時カウントしておく

  drawGame();
  var col = "yellow";
  if (gtime < 30*5 && gtime%10 < 5) col = "red";
  fText("TIME " + gtime, 150, 30, 36, col);
  fText("SCORE " + score, 540, 30, 36, "white");
  fText("STAGE " + stage, 930, 30, 36, "cyan");
  lineW(3);
  fRect(855 + int(plX/SIZE), 60, 4, 16, "pink");
  sRect(855, 60, 154, 16, "white");


  switch(idx) {
    case 0: //タイトル画面
      drawImg(20, -200, 0); //イラストの画像
      drawImg(21, 300, 60); //タイトルロゴの画像
      if (tmr%30 < 15) fText("PRESS [SPACE] TO START!", 540, 520, 40, "gold");
      if (inkey == 32) {
        stage = 1;
        score = 0;
        idx = 1;
        tmr = 0;
      }
    break;

    case 1:   //マップデータをセット、変数に初期値を代入。
      if (tmr == 1) {
        setStage();
        initVar();
      }
      if (tmr > 10) fText("STAGE " + stage + " START!", 540, 240, tmr, "cyan");
      if (tmr > 80) {
        playBgm(0);
        idx = 2;
      }
    break;

    case 2:   //ゲームをプレイ
      gtime--;
      var mp = movePlayer();
      if (mp == 1) {idx = 4; tmr = 0;}
      if (mp == -1 || gtime == 0) {idx = 3; tmr = 0;}
    break;

    case 3:   //ゲームオーバー
      if (tmr == 1) stopBgm();
      if (tmr == 2) playSE(4);
      if (tmr == 90) playSE(5);
      if (tmr > 100) {
        fText("GAME OVER", 540, 240, 60, "red");
        fText("Retry? [Y]or[N]", 540, 480, 40, "lime");
        if (inkey == 89) {
          idx = 1;      //Y押されたらゲーム再開
          tmr = 0;
        }
        if (inkey == 78) idx = 0;   //Nが押されたらタイトル画面へ
      }
    break;

    case 4:   //ゲームクリア
      if (tmr == 1) stopBgm();
      if (tmr < 9) {
        mapdata[8-tmr][149] = 6;
        mapdata[9-tmr][149] = 0;
      }
      if (tmr == 10) playSE(3);
      if (tmr > 10) fText("STAGE CLEAR!", 540, 240, 60, "cyan");
      if (tmr > 200) {
        stage++;
        idx = 1;
        tmr = 0;
      }
      if (gtime > 0) {
        gtime = (int(gtime/20) - 1)*20;
        score += 20;
      }
    break;
  }
}