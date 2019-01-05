
var MongoClient = require('mongodb').MongoClient;
var settings = require("./setting.js");
//用户的表结构、数据属性模型
module.exports=new mongoose.Schema({
    //用户名，密码
    username:String,
    password:String,
    isAdmin:{
        type:Boolean,
        default:false
    }
});