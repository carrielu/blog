
var MongoClient = require('mongodb').MongoClient;
var settings = require("./setting.js");
//�û��ı�ṹ����������ģ��
module.exports=new mongoose.Schema({
    //�û���������
    username:String,
    password:String,
    isAdmin:{
        type:Boolean,
        default:false
    }
});