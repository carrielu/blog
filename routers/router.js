var formidable = require('formidable');
var db = require("../model/db.js");
var md5 = require("../model/md5.js");
var path         = require('path');
var fs = require("fs");
var moment = require('moment');
var gm = require("gm");    //图片处理包
var MongoClient = require('mongodb').MongoClient, test = require('assert');
//首页
exports.showIndex = function (req,res,next) {
    res.render("index");
};

//Express 应用使用回调函数的参数： request 和 response 对象来处理请求和响应的数据。
//request 对象表示 HTTP 请求，包含了请求查询字符串，参数，内容，HTTP 头部等属性。
//response 对象表示 HTTP 响应，即在接收到请求时向客户端发送的 HTTP 响应数据

//个人中心
exports.showUserInfo = function (req, res ,result) {
    var topic = req.query.keyword;
    var topic1 = new RegExp(topic);
    db.find("article",{"topic":topic1},{"pageamount":6,"sort":{"date":-1}}, function (err, result) {
        if (err) {
            console.log(err);
        }
        res.render("usercenter", {
            "allResult": result,
            "allResult2": result
        });
        console.log(result);
        console.log(result.length);
    });
};
// --获取当前用户的文章
/*exports.getUserInfo = function(req,res,next){
    var page = req.query.page;
    var username = req.query.username;
    console.log(username);
    db.find("users",{"username":username}, function (err, result) {
        var obj = {"allResult" : result};
        res.json(obj);
    });
};*/

exports.getUserInfo = function (req, res, result) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var username = fields.username;
        console.log(username);
        db.find("users",{"username":username},function (err,result2) {
            if(err){
                console.log(err);
            }
            var obj = {"allResult2" : result2};
            res.json(obj);
            console.log(result2);
        });
    });
};

//显示当前用户的文章
exports.getUserArticle = function(req,res,next) {
    var form = new formidable.IncomingForm();
    var page = req.query.page;
    form.parse(req, function(err, fields, files) {
        var username = fields.username;
        console.log(username);
        db.find("article", {"publisher":username}, {"pageamount":6,"page":page,"sort":{"date":-1}},
            function (err, result) {
                var obj = {"allResult" : result};
                res.json(obj);
            });
    });
};
//个人中心结束


//编写页面
exports.showRecording = function (req, res, next) {
    var username = req.params["username"];
    if(req.session.login != "1"){
        res.send("请登陆！");
    }else {
        res.render("recording",
            {"username": req.session.login == "1" ? req.session.username : "",
                avatar: req.session.avatar});
    }
};
exports.doRecording = function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields) {
        db.getAllCount("article", function (count) {
            var allCount = count.toString();
            var date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            //写入数据库
            db.insertOne("article", {
                "ID" : parseInt(allCount) + 1,
                "topic" : fields.topic,
                "publisher" : fields.publisher,
                "classify" : fields.classify,
                "content" : fields.content,
                "date" : date,
                "thumbsUp": 0,
                "visitNum" : 0
            },function (err, result) {
                if(err){
                    res.send("-1");
                    return;
                }
                res.send("1");
            });
        });
    });
};
 //取得文章
 exports.getArticle = function (req, res, next) {
    var page = req.query.page;
     db.find("article",{},{"pageamount":6,"page":page,"sort":{"date":-1}}, function (err, result) {
        var obj = {"allResult" : result};
        res.json(obj);
     });
 };
//取得当前用户的文章
exports.getArticle1 = function (req, res, next) {
    var page = req.query.page;
    var username=req.session["username"];
    db.find("article", {"publisher":username}, {"pageamount":6,"page":page,"sort":{"date":-1}},
        function (err, result) {
            var obj = {"allResult" : result};
            res.json(obj);
        });
};
//取得总页数
exports.getAllAmount = function (req, res, next) {
    db.getAllCount("article", function (count) {
        res.send(count.toString());
    });
};
//文章页面
exports.showArticle = function (req, res, next) {
    if(req.query.ID == undefined){
        res.send("你想干嘛？");
        return;
    }
    var aId = parseInt(req.query.ID);
    db.find("article",{"ID":aId},function (err,result) {
        if(err){
            console.log(err);
        }
        res.render("article",{
            "allResult" : result[0]
        });
    });
};
//删除文章
exports.delArticle =function (req, res, result) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var ID = parseInt(fields.ID);
        db.deleteMany("article",{"ID":ID},function (err,results) {
            if(err){
                console.log("删除文章错误:"+err);
                return
            }
            res.send("1");
        });
    });
};
//显示修改文章页面
exports.updateArticle = function (req, res) {
    var username = req.params["username"];
    var aId = parseInt(req.query.ID);
    if(req.query.ID == undefined){
        res.send("获取不到该篇文章的ID");
        return;
    }
    db.find("article",{"ID":aId},function (err,result) {
        if(err){
            console.log(err);
        }
        res.render("updateArticle",{
            "login": req.session.login == "1" ? true : false,
            "username": req.session.username,
            "allResult" : result[0],
            avatar: req.session.avatar,
            "active": "修改文章"
        });
    });
};
//修改文章操作
exports.doUpdateArticle = function (req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields) {
        console.log(fields);
        db.getAllCount("article", function (count) {
            var allCount = count.toString();
            var date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            //写入数据库
            db.updateMany("article", {
                "topic" : fields.topic
            }, {
                $set: {"classify" : fields.newClassify,
                    "content" : fields.newContent,
                    "date" : date}
            },function (err) {
                if(err){
                    console.log(err);
                }
                res.send("1");
            });
        });
    });
};

//注册页面
exports.showRegist = function (req, res, next) {
    res.render("regist", {
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "password": req.session.login == "1" ? req.session.password : "",
        "active": "注册"
    });
};
//注册业务
exports.doRegist = function (req, res, next) {
    //得到用户填写的东西
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //点击注册之后获取表单参数
        var username = fields.username;
        var password = fields.password;

        //console.log(username,password);
        //查询数据库中是不是有这个人
        db.find("users", {"username": username}, function (err, result) {
            if (err) {
                res.send("-3"); //服务器错误
                return;
            }
            if (result.length != 0) {
                res.send("-1"); //被占用
                return;
            }
            //没有相同的人，就可以执行接下来的代码了
            password = md5(md5(password) + "nodejs");  //采用md5加密方法

            //现在可以证明，用户名没有被占用
            db.insertOne("users", {
                "username": username,
                "password": password,
                "avatar": "moren.jpg"
            }, function (err, result) {
                if (err) {
                    res.send("-3"); //服务器错误
                    return;
                }
                req.session.login = "1";
                req.session.username = username;

                res.send("1"); //注册成功，写入session
            })
        });
    });
};
//显示登录页面
exports.showLogin = function (req, res, next) {
    res.render("login", {
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        avatar: req.session.avatar,
        "active": "登陆"
    });
};
//登录页面的登录执行
exports.doLogin = function (req, res, next) {
    //得到用户表单
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //得到表单之后做的事情
        var username = fields.username;
        var password = fields.password;
        var md5Password = md5(md5(password) + "nodejs");
        //查询数据库，看看有没有个这个人
        db.find("users", {"username": username}, function (err, result) {
            if (err) {
                res.send("-5");
                return;
            }
            //用户名不存在
            if (result.length == 0) {
                res.send("-1");
                return;
            }
            //用户名存在，进一步看看这个人的密码是否匹配
            if (md5Password == result[0].password) {
                req.session.login = "1";   //设置session
                req.session.username = username;
                req.session.password = result[0].password;
                req.session.avatar = result[0].avatar;
                res.send("1");  //登陆成功
                return;
            } else {
                res.send("-2");  //密码错误
                return;
            }
        });
    });
};
//退出登录操作
exports.doLogOff = function (req, res) {
    req.session.login = null;
    req.session.username = null;
    req.session.password = null;
    //跳转到首页
    res.redirect("/");
};
//显示修改密码页面
exports.modifyPassword = function (req, res) {
    var username = req.params["username"];
    var password = req.params["password"];
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render("modifypassword", {
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "password": req.session.login == "1" ? req.session.password : "",
        "active": "修改密码"
    })


};
//修改密码操作
exports.doModifyPassword = function (req, res) {
    //用户修改密码表单
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var newPassword = fields.newPassword;
        var newPasswordTwo = fields.newPasswordTwo;
        var md5NewPassword = md5(md5(newPassword) + "nodejs");
        var md5NewPasswordTwo = md5(md5(newPasswordTwo) + "nodejs");

        if(newPassword == "" || newPasswordTwo == "" ) {
            res.send("-1");
            return;
        }
        else if(md5NewPassword != md5NewPasswordTwo) {
            res.send("-2");
            return;
        }

        //更改数据库当前用户的密码
        db.updateMany("users", {"username": req.session.username}, {
            $set: {"password": md5NewPasswordTwo}
        }, function (err, results) {
            res.send("1");
        });
    });
};

//设置头像页面，必须保证此时是登陆状态
exports.showSetAvatar = function (req, res, next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render("setavatar", {
        "login": true,
        "username": req.session.username,
        "password": req.session.password,
        avatar: req.session.avatar,
        "active": "修改头像"
    });
};
//上传--设置头像
exports.doSetAvatar = function (req, res, next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }

    var form = new formidable.IncomingForm();
    form.uploadDir = path.normalize(__dirname + "/../public/images");
    form.parse(req, function (err, fields, files) {
        console.log(files);
        var oldpath = files.uploadAvator.path;
        var newpath = path.normalize(__dirname + "/../public/images") + "/" + req.session.username + ".jpg";
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                res.send("失败");
                return;
            }
            req.session.avatar = req.session.username + ".jpg";
            //跳转到切的业务
            res.redirect("/cut");
        });
    });
}
//显示切图页面
exports.showcut = function (req, res) {
    var username = req.params["username"];
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render("cut", {
        "username": req.session.login == "1" ? req.session.username : "",
        avatar: req.session.avatar
    })
};
//执行切图
exports.doCut = function (req, res, next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }

    //这个页面接收几个GET请求参数--w、h、x、y
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;

    gm("./public/images/" + filename)
        .crop(w, h, x, y)
        .resize(100, 100, 200,200)
        .write("./public/images/" + filename, function (err) {
            if (!err) {
                res.send("-1");
                return;
            }
            //更改数据库当前用户的avatar这个值
            db.updateMany("users", {"username": req.session.username}, {
                $set: {"avatar": req.session.avatar}
            }, function (err, results) {
                res.send("1");
            });
        });
}

//后台页面
//JavaScript!
exports.showJavaScript = function (req, res, result) {
    res.render("JavaScript");
};
//JavaScript
exports.getJavaScript = function (req, res, next) {
    db.find("article",{"classify":"JavaScript"},{"pageamount":6,"sort":{"date":-1}}, function (err, result) {
        if(err){
            console.log(err);
        }
        var obj = {"allResult" : result};
        res.json(obj);
    });
};
//NodeJS!
exports.showNodeJS = function (req, res, result) {
    res.render("NodeJS");
};
exports.getNodeJS = function (req, res, next) {
    db.find("article",{"classify":"NodeJS"},{"pageamount":6,"sort":{"date":-1}}, function (err, result) {
        if(err){
            console.log(err);
        }
        var obj = {"allResult" : result};
        res.json(obj);
    });
};
//NodeJS
//Environment!
exports.showEnvironment = function (req, res, result) {
    res.render("Environment");
};
exports.getEnvironment = function (req, res, next) {
    db.find("article",{"classify":"Environment"},{"pageamount":6,"sort":{"date":-1}}, function (err, result) {
        if(err){
            console.log(err);
        }
        var obj = {"allResult" : result};
        res.json(obj);
    });
};
//About!
exports.showAbout = function (req, res ,result) {
    res.render("about");
};

//addVisitorNum!
exports.addVisitorNum = function (req, res, result) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var aId = parseInt(fields.ID);
        console.log(aId);
        db.find("article",{"ID":aId},function (err,result) {
            if(err){
                console.log(err);
            }
            var visitNum = result[0].visitNum;
            var ID = result[0].ID;
            db.updateMany("article",{"ID":ID},{$set:{"visitNum":visitNum+1}},function (err,results) {
                if(err){
                    console.log("游览数据错误:"+err);
                    return
                }
                res.send("1");
            });
        });
    });
};
//addThumbsUp!
exports.addThumbsUp = function (req,res,result) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var aId = parseInt(fields.ID);
        db.find("article",{"ID":aId},function (err,result) {
            if(err){
                console.log(err);
            }
            var thumbsUp = result[0].thumbsUp;

            var ID = result[0].ID;
            db.updateMany("article",{"ID":ID},{$set:{"thumbsUp":thumbsUp+1}},function (err,results) {
                if(err){
                    console.log("点赞数据错误:"+err);
                    return
                }
                res.send("1");
            });
        });
    });
};

//个人信息
//编写个人信息
//取得个人信息
exports.getAccount = function (req, res, next) {
    var page = req.query.page;
    db.find("users",{},{"pageamount":6,"page":page,"sort":{"date":-1}}, function (err, result) {
        var obj = {"allResult" : result};
        res.json(obj);
    });
};
exports.showAccount = function (req, res, next) {
    /*var username = req.params["username"];
    if(req.session.login != "1"){
        res.send("请登陆！");
    }else {
        res.render("account", {
                "login": req.session.login == "1" ? true : false,
                "username": req.session.login == "1" ? req.session.username : "",
                "password": req.session.login == "1" ? req.session.password : "",
                avatar: req.session.avatar,
                "active" : "个人信息"
            });
    }*/
    res.render("account", {
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "password": req.session.login == "1" ? req.session.password : "",
        avatar: req.session.avatar,
        "active" : "个人信息"
    });
};
exports.doAccount = function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields) {
        db.getAllCount("users", function (count) {
            var allCount = count.toString();
            var date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            //写入数据库
            db.insertOne("users", {
                "age": fields.age,
                "sex":fields.sex,
                "hover":fields.hover,
                "good":fields.good
            },function (err, result) {
                if(err){
                    res.send("-1");
                    return;
                }
                res.send("1");
            });
        });
    });
};
//修改个人信息操作
exports.doModifyAccount = function (req, res) {
    var hover = [];  //初始化爱好数组
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var age = fields.age;
        var sex = fields.sex;
        var good = fields.good;
        if(age == "") {
            res.send("-1");
            return;
        }
        else if(sex == "") {
            res.send("-2");
            return;
        }
        else if(fields.hover == null) {
            res.send("-3");
            return;
        }
        for(var i=0;i<fields.hover.length;i++) {
            hover.push(fields.hover[i]);
        }
        //更改数据库当前用户信息
        db.updateMany("users", {"username": req.session.username}, {
            $set: {"age": age,"sex":sex,"hover":hover,"good":good}
        }, function (err, results) {
            res.send("1");
        });
    });
};
//显示修改密码页面
exports.modifyAccount = function (req, res) {
    var username = req.params["username"];
    var password = req.params["password"];
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }

    res.render("modifyaccount", {
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "password": req.session.login == "1" ? req.session.password : "",
        avatar: req.session.avatar,
        "active": "修改个人信息"
    })
};

//Comment!
exports.showComment = function (req, res ,result) {
    res.render("comment");
};
exports.doComment = function (req, res, result) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var name = fields.name;
        var email = fields.email;
        var content = fields.content;
        db.getAllCount("article", function (count) {
            var allCount = count.toString();
            var date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            db.insertOne("comment", {
                "ID" : parseInt(allCount) + 1,
                "name" : name,
                "email" : email,
                "content" : content,
                "date" : date
            },function (err, result) {
                if(err){
                    console.log("留言错误" + err);
                    return;
                }
                res.send("1");
            });
        });
    });
};
//取得留言
exports.getComment = function (req, res, next) {
    var page = req.query.page;
    db.find("comment",{},{"pageamount":6,"page":page,"sort":{"date":-1}}, function (err, result) {
        var obj = {"allResult" : result};
        res.json(obj);
    });
};
//取得留言总页数
exports.getAllCountComment = function (req, res, next) {
    db.getAllCount("comment", function (count) {
        res.send(count.toString());
    });
};
//删除留言
exports.delComment =function (req, res, result) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var ID = fields.ID;
        db.deleteMany("comment",{"name":ID},function (err,results) {
            if(err){
                console.log("删除留言错误:"+err);
                return
            }
            res.send("1");
        });
    });
};


//Discuss!评论
exports.showDiscuss = function (req, res ,result) {
    res.render("paper");
};
exports.doDiscuss = function (req, res, result) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var name = fields.name;
        var content = fields.content;
        db.getAllCount("article", function (count) {
            var allCount = count.toString();
            var date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            db.insertOne("paper", {
                "ID" : parseInt(allCount) + 1,
                "name" : name,
                "content" : content,
                "date" : date
            },function (err, result) {
                if(err){
                    console.log("留言错误" + err);
                    return;
                }
                res.send("1");
            });
        });
    });
};
//取得评论
exports.getDiscuss = function (req, res, next) {
    var page = req.query.page;
    db.find("paper",{},{"pageamount":6,"page":page,"sort":{"date":-1}}, function (err, result) {
        var obj = {"allResult" : result};
        res.json(obj);
    });
};
//取得评论总页数
exports.getAllCountDiscuss = function (req, res, next) {
    db.getAllCount("paper", function (count) {
        res.send(count.toString());
    });
};

//删除评论
exports.delDiscuss =function (req, res, result) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var ID = fields.ID;
        db.deleteMany("paper",{"name":ID},function (err,results) {
            if(err){
                console.log("删除留言错误:"+err);
                return
            }
            res.send("1");
        });
    });
};

//User
exports.showUser = function (req, res ,result) {
    res.render("accountmanage");
};
//取得用户信息
exports.getUser = function (req, res, next) {
    var page = req.query.page;
    db.find("users",{},{"pageamount":6,"page":page,"sort":{"date":-1}}, function (err, result) {
        var obj = {"allResult" : result};
        res.json(obj);
    });
};
//取得用户总页数
exports.getAllCountUser = function (req, res, next) {
    db.getAllCount("users", function (count) {
        res.send(count.toString());
    });
};
//删除用户
exports.delUser =function (req, res, result) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        console.log(fields);
        var ID = fields.ID;
        db.deleteMany("users",{"username":ID},function (err,results) {
            if(err){
                console.log("删除用户错误:"+err);
            }
            res.send("1");
        });
    });
};


//blog-manage!
exports.getManage = function (req, res, result) {
    var username = req.params["username"];
    if(req.session.login != "1"){
        res.send("请登陆！");
    }else {
        res.render("manage",
            {"username": req.session.login == "1" ? req.session.username : "",
                avatar: req.session.avatar});
    }
};

//管理员删除文章
exports.delPaper =function (req, res, result) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var ID = fields.ID;
        db.deleteMany("article",{"date":ID},function (err,results) {
            if(err){
                console.log("删除文章错误:"+err);
                return
            }
            res.send("1");
        });
    });
};

//留言管理
exports.getAccountManage = function (req, res, result) {
    var username = req.params["username"];
    if(req.session.login != "1"){
        res.send("请登陆！");
    }else {
        res.render("accountmanage",
            {"username": req.session.login == "1" ? req.session.username : "",
                avatar: req.session.avatar});
    }
};
//用户管理
exports.getUserManage = function (req, res, result) {
    var username = req.params["username"];
    if(req.session.login != "1"){
        res.send("请登录！");
    }else {
        res.render("usermanage",
            {"username": req.session.login == "1" ? req.session.username : "",
                avatar: req.session.avatar});
    }
};
//文章管理
exports.getPaperManage = function (req, res, result) {
    var username = req.params["username"];
    if(req.session.login != "1"){
        res.send("请登录！");
    }else {
        res.render("papermanage",
            {"username": req.session.login == "1" ? req.session.username : "",
                avatar: req.session.avatar});
    }
};


////显示当前用户的文章信息
exports.getArticle = function (req, res, next) {
    //这个页面接收一个参数，页面
    var page = req.query.page;
    var username = req.query.username;

    db.find("article",{"publisher":username},function(err){
        if(err){
            return err;
        }else{
            db.find("article",{},{"pageamount":6,"page":page,"sort":{"date":-1}}, function (err, result) {
                var obj = {"allResult" : result};
                res.json(obj);
            });
        }
    });
};

//显示当前用户个人信息
exports.getUser1 = function (req, res, next) {
    var page = req.query.page;
    var username = req.session.username;
    db.find("users",{"username":username}, function (err, result) {
        var obj = {"allResult" : result};
        res.json(obj);
    });
};

//搜索
/*exports.search = function (req, res, next) {
    var topic = req.query.keyword;
    db.find("article",{"topic":topic},{"pageamount":6,"sort":{"date":-1}}, function (err, result) {
        var obj = {"allResult" : result};
        res.json(obj);
    });
};*/
//模糊查询
exports.showSearch = function (req, res, next) {
    var topic = req.query.keyword;
    var topic1 = new RegExp(topic);
    db.find("article",{"topic":topic1},{"pageamount":6,"sort":{"date":-1}}, function (err, result) {
        if(err){
            console.log(err);
        }
        res.render("search",{
            "allResult" : result
        });
        console.log(result);
        console.log(result.length);
        /*var obj = {"allResult" : result};
        res.json(obj);*/
    });
};
