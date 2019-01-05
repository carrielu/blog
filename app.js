var express      = require("express");
var app          = express();
var router       = require("./routers/router.js");
var path         = require('path');
var bodyParser   = require('body-parser');  // node.js 中间件，用于处理 JSON, Raw, Text 和 URL 编码的数据。
var ejs          = require('ejs');
var ueditor      = require('ueditor');
var session = require('express-session');//解析Session的工具。通过req.session可以取到传过来的session，并把它们转成对象。
var fs = require('fs');
var logger = require('morgan');

//打印日志
var accessLog = fs.createWriteStream('access.log', {flags : 'a'});
var errorLog = fs.createWriteStream('error.log', {flags : 'a'});

app.use(logger('dev'));     //打印到控制台
app.use(logger('combined', {stream : accessLog}));      //打印到log日志


//使用session
app.use(session({
    secret : 'keyboard cat',
    resave : false,
    saveUninitialized : true
}));

app.use(bodyParser.json());

app.use(express.static("./public"));

//使用静态文件
app.use("/avatar",express.static("./public/images"));

//ueditor
app.use("/libs/ueditor/ue", ueditor(path.join(__dirname, 'public'), function (req, res, next) {

    // ueditor 客户发起上传图片请求
    if (req.query.action === 'uploadimage') {
        var foo = req.ueditor;

        var imgname = req.ueditor.filename;

        var img_url = '/upload';
        res.ue_up(img_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
    }

    //  客户端发起图片列表请求
    else if (req.query.action === 'listimage') {
        var dir_url = '/upload';
        res.ue_list(dir_url);  // 客户端会列出 dir_url 目录下的所有图片
    }

    // 客户端发起其它请求
    else {

        res.setHeader('Content-Type', 'application/json');
        res.redirect('/libs/ueditor/nodejs/config.json')
    }

}));
//模板引擎
app.set("view engine","ejs");

//通过路由提取出请求的URL以及GET/POST参数
//封装回调函数

//首页
app.get("/",router.showIndex);

//个人中心
app.get("/usercenter", router.showUserInfo);
app.post("/getUserInfo", router.getUserInfo);
app.post("/getUserArticle", router.getUserArticle);

//编写页面
app.get("/recording", router.showRecording);
//执行保存
app.post("/doRecording", router.doRecording);

//取得文章
app.post("/getArticle", router.getArticle);
app.post("/getArticle1", router.getArticle1);

//取得总页数
app.post("/getAllAmount", router.getAllAmount);
//文章页面
app.get("/article", router.showArticle);
//删除文章
app.post("/delArticle", router.delArticle);
//修改文章
app.get("/updateArticle",router.updateArticle);
app.post("/doUpdateArticle",router.doUpdateArticle);

//注册页面
app.get("/regist", router.showRegist);
app.post("/doregist",router.doRegist);

//登录页面
app.get("/login", router.showLogin);
app.post("/doLogin", router.doLogin);
//退出登录操作
app.get("/doLogOff",router.doLogOff);
//修改密码
app.get("/modifyPassword",router.modifyPassword);
app.post("/doModifyPassword",router.doModifyPassword);

//设置头像页面
app.get("/setAvatar",router.showSetAvatar);
//执行设置头像，Ajax服务
app.post("/doSetAvatar",router.doSetAvatar);
//剪裁头像页面
app.get("/cut",router.showcut);
//执行剪裁操作
app.get("/doCut",router.doCut);


//分类文章
//javascript!
app.get("/JavaScript",router.showJavaScript);
app.post("/getJavaScript", router.getJavaScript);
//NodeJS!
app.get("/NodeJS",router.showNodeJS);
app.post("/getNodeJS", router.getNodeJS);
//Environment!
app.get("/Environment", router.showEnvironment);
app.post("/getEnvironment", router.getEnvironment);
/*//About!
app.get("/About", router.showAbout);*/

//Discuss!
app.get("/Discuss", router.showDiscuss);
app.post("/doDiscuss", router.doDiscuss);
app.post("/getDiscuss", router.getDiscuss);
app.post("/getAllCountDiscuss", router.getAllCountDiscuss);
app.post("/delDiscuss", router.delDiscuss);

//Comment!
app.get("/Comment", router.showComment);
app.post("/doComment", router.doComment);
app.post("/getComment", router.getComment);
app.post("/getAllCountComment", router.getAllCountComment);
app.post("/delComment", router.delComment);

//User
app.get("/User", router.showUser);
app.post("/getUser", router.getUser);
app.post("/getUser1", router.getUser1);
app.post("/getAllCountUser", router.getAllCountUser);
app.post("/delUser", router.delUser);

//后台页面
//文章管理
app.get("/manage",router.getManage);
//留言信息管理
app.get("/accountmanage",router.getAccountManage);
//用户信息管理
app.get("/usermanage",router.getUserManage);
//文章信息管理
app.get("/papermanage",router.getPaperManage);

//编写个人信息
app.get("/account",router.showAccount);
//保存个人信息
app.post("/doAccount", router.doAccount);

//取得个人信息
app.post("/getAccount", router.getAccount);
//修改个人信息
app.get("/modifyAccount",router.modifyAccount);
app.post("/doModifyAccount",router.doModifyAccount);


//管理员删除留言？
app.post("/delPaper", router.delPaper);

//VisitorNum(游览数)
app.post("/addVisitorNum", router.addVisitorNum);

//addThumbsUp(点赞数)
app.post("/addThumbsUp", router.addThumbsUp);

//搜索
app.get("/search",router.showSearch);


// 404 处理: catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

console.log("Server running");

app.listen(3000);

//服务入口文件
