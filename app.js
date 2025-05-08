var express = require('express');
var parser = require('body-parser');
var path = require('node:path');
var app = express();
var port = process.env.PORT || 3000;
var ejs = require('ejs');
var assets = path.join(__dirname,"public");
var statusLog ='';
var multer = require('multer');
var mysql = require('mysql');
app.use(express.static(assets));
app.use(parser.urlencoded({extended: true}));
app.use(parser.json());
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
app.get("/",(req,res)=>{
    res.render('index',{author: 'Niyonkuru Pacifique',logStatus: statusLog,userData:'',user_name:''});
});

const conn = mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'blackman',
    database: process.env.MYSQLDATABASE || 'messenger',
    port: process.env.MYSQLPORT || 3306
});

conn.connect((err) => {
    if (err) {
        console.log('This error occurred while trying to connect to the database: ', err);
    } else {
        console.log('Database connected successfully.');
    }
});

app.get('/test',(rep,res)=>{
    res.render('icons');
})
app.get("/compose",(req,res)=>{
    res.render('compose');
})
app.get("/menu",(req,res)=>{
    res.render('menubar',{author: 'Niyonkuru Pacifique'});
})
var storage = multer.diskStorage({
    destination: (req,file,cb) =>{
        cb(null,'public/uploads');
    },
    filename: (req,file,cb) =>{
        fNme = Date.now() + '-' + file.originalname;
        cb(null, fNme);
    }
})
var upload = multer({storage: storage});
app.post('/signUpForm', upload.single('profile'), (req, res) => {
    const name = req.body.name;
    const password = req.body.password;
    const filePath = req.file ? req.file.path : 'No file uploaded';
    var savePath = "uploads/"+fNme;
    console.log("User signed up \n Sign-up info:\n Name:", name, "\n Password:", password, "\nFile:", filePath);
    conn.query("INSERT INTO users(user_name,password,profile) VALUES(?,?,?);",[name,password,savePath],(err,result)=>{
        if(err){
            console.log("Error while trying to save users sign up data: ",err);
        }
    })
    // Optionally update statusLog and render success page or redirect
    //statusLog = `${name} signed up successfully.`;
    res.render('signIn', { author: 'Niyonkuru Pacifique', logStatus: statusLog });
});
app.post("/signInForm",(req,res)=>{
    var user_names = req.body.named;
    var user_password = req.body.passwordd;
    console.log("User ",user_names,"  attempting to sign in");
    conn.query("SELECT * FROM users WHERE user_name = ? AND password = ?;",[user_names,user_password],(err,result)=>{
        if(err){
            console.log('Error occured while trying to check users credentials to sign in: ',err);
        }
        else if(result.length == 1){
            var statusLog = 'done';
            res.render('index',{author: 'Niyonkuru Pacifique',logStatus: statusLog,userData: result[0].id,user_name:user_names});
            console.log('User: ',user_names," Signed in sucsessfully \n ");
        }
    })
});
app.get('/signIn',(req,res)=>{
    res.render('signIn');
})
app.get('/signUp',(req,res)=>{
    res.render('signUp');
})
app.get('/profiler',(req,res)=>{
    res.render('profile');
})
app.get('/userData',(req,res)=>{
    var id = req.query.id;
    conn.query("SELECT * FROM users WHERE id = ?",[id],(err,result)=>{
        if(err){
            console.log("Error while trying to get users data based on id ",err);
        }
        else{
            res.json(result);
            console.log(result);
        }
    })
})
app.post("/message",(req,res)=>{
    var from = req.body.from;
    var to = req.body.to;
    var message = req.body.message;
    console.log('Chating between ',from," and ",to);
    conn.query("INSERT INTO chats(message_from,message_to,message) VALUES(?,?,?);",[from,to,message],(err,result)=>{
        if(err){
            console.error("Error while syncing chats: ",err);
        }else{
            conn.query("SELECT * FROM chats WHERE message_from = ? OR message_to = ?;",[from,from],(err,result)=>{
                if(err){
                    console.error("Not fetching chats because: ",err);
                }
                else{
                   var userChats = result;
                    res.render('chat',{to: to,pageFrom: 'message'});
                    console.log(result.length);
                }
            })
        }
    })
})
app.get('/chats',(req,res)=>{
    var user_names = req.url.names;
    conn.query("SELECT * FROM chats WHERE message_from = ? OR message_to = ?;",[user_names,user_names],(err,result)=>{
        if(err){
            console.error("Not fetching chats because: ",err);
        }
        else{
            userChats = result;
            res.render('chat',{to: '',pageFrom: ''});
        }
    })
})
app.get('/getChat',(req,res)=>{
    var user_names = req.query.names;
    var to = req.query.to;
    conn.query("SELECT * FROM chats WHERE message_from = ? AND message_to = ? OR message_from =? AND message_to = ?;",[user_names,to,to,user_names],(err,result)=>{
        if(err){
            console.error("Not fetching chats because: ",err);
        }
        else{
           var userChats = result;
            res.json(userChats);
            console.log('Dialog betwwen ',user_names ,' and ',to,'affected row: ',result.length);
        }
    })
})
app.get('/RTOS',(req,res)=>{
    var user_names = req.query.names;
    var to = req.query.to;
    conn.query("SELECT * FROM chats WHERE message_from = ? AND message_to = ? OR message_from =? AND message_to = ?;",[user_names,to,to,user_names],(err,result)=>{
        if(err){
            console.error("Not fetching chats because: ",err);
        }
        else{
            res.send(result.length);
        }
    })
})
app.get('/getChatWith',(req,res)=>{
    var user_names = req.query.names;
    conn.query("SELECT * FROM users WHERE user_name = ?",[user_names],(err,result)=>{
        if(err){
            console.log("Error while trying to get users data based on id ",err);
        }
        else{
            res.json(result);
        }
    })
})
app.get('/chated',(req,res)=>{
    var user_name = req.query.username;
    conn.query("SELECT DISTINCT(user_name),profile FROM chats JOIN users WHERE chats.message_from = users.user_name OR chats.message_to = users.user_name AND users.user_name = ?;",[user_name],(err,result)=>{
        if(err){
            console.log("Erro while trying to retrieve recentt chats ",err);
        }else{
            res.json(result);
            console.log('Recent chats retrieved succsessfully for user ',user_name);
        }
    })
})
app.get('/toChat',(req,res)=>{
    var toChat = req.query.to;
    res.render('chat',{to: toChat,pageFrom: 'chat'});
})
app.listen(port, ()=>{
    console.log('App running on port ', port);
})