// import * as http from 'http';
const http = require('http');
const path = require('path');
const Koa = require('koa');
const koaBody = require('koa-body').default;
const cors = require('@koa/cors');
const Router = require('koa-router');;
const { faker } = require('@faker-js/faker');
const koaStatic = require('koa-static');
const fs = require('fs');// для работы с файлами
// import WebSocket, { WebSocketServer } from "ws"; // для общения сервака и клиента.Протокол связи поверх TCP-соединения, предназначенный для обмена сообщениями между браузером и веб-сервером, используя постоянное соединение. 
const WS = require('ws');
const { v4: uuidv4 } = require('uuid');
const WebSocketServer = require('ws').Server;

const app = new Koa();
const router = new Router(); // создание роутера
const pub = path.join(__dirname, '/public'); // // итоговая папка которую раздаем назначить определенную папку, как папку которую мы будем раздавать по http. Раздаваеть ее содержимое как статические файлы
app.use(koaStatic(pub));

app.use(cors({
    origin: '*',
    credentials: true, //Если сервер согласен принять запрос с авторизационными данными, он должен добавить заголовок Access-Control-Allow-Credentials: true к ответу, в дополнение к Access-Control-Allow-Origin.
    'Access-Control-Allow-Origin': true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
)

app.use(koaBody({
   urlencoded: true, // форма у нас url  ин kодед. Данные будут закодированы. Объект со всеми разобранными данными
   multipart: true,// при использовании multipart/form-data
   json: true, 
  }));

 

  // где хранятся сообщения
const chat = {
  message: [],
  link: [],
  image: [],
  video: [],
  audio: [],
  file: [],
};

const allMessages = [];
const userState = []; 

  // ВХОД - ЗАПРОС
  router.post("/new-user", async (ctx) => {
    if (Object.keys(ctx.request.body).length === 0) {// Object.keys() возвращает массив из собственных перечисляемых свойств переданного объекта. Если будет пустой
        const result = {
        status: "error",// ошибка
        message: "This name is already taken!", // Это имя уже занято!
      };
      ctx.response.body = result;
    }
    const { name } = ctx.request.body; // с тела запроса берем имя
    const isExist = userState.find((user) => user.name === name); // сравниваем с текущими именами
    if (!isExist) { // если не находит создает новый объект с таким именем и присваевает айдишник
      const newUser = {
        id: uuidv4(),
        name: name,
      };
      userState.push(newUser);// добавляет к списку имен
      const result = { // положительный статус который вернет он фронту с новым именем
        status: "ok",
        user: newUser,
      };
      ctx.response.body = result;
    } else {// вернет ошибку
      const result = {
        status: "error",
        message: "This name is already taken!",// Это имя уже занято
      };
      ctx.response.body = result;
    }
  });


//все сообщения
  router.get("/allmsg", async (ctx) => {// при запросе /news с помощью метода get . Обяъвление роетера
    ctx.response.body = JSON.stringify(chat); // этот запрос будет обработан этим обработчиком
    console.log(ctx.response.body, "result");
  });

     
  //выводить определенный TYPE
  router.get("/allmsgtype", async (ctx) => {// при запросе /news с помощью метода get . Обяъвление роетера
    const { type } = ctx.request.body; // с тела запроса берем имя\
    console.log("allmsgtype" + type)
    console.log("chat" + chat)
    let hasKey = Object.keys(chat).some(x => x == type)
    if (!hasKey) {
      console.log("Error! Not this allmsgtype" + type);
      ctx.response.body = type; // вернет ошибку
    }

    let data = chat`.${type}`;
    console.log(data)
    ctx.response.body = JSON.stringify(data); // этот запрос будет обработан этим обработчиком
    console.log(ctx.response.body, "result");
  });



app.use(router.routes()).use(router.allowedMethods()) // важно отправить все сформированные роутеры в app.use
//routes этот метод работает также как мидл вейр позволяет внедрить синтаксис router в app.use в Koa
//////////////////////////////////////////////////////////

const port = process.env.PORT || 3000;
const server = http.createServer(app.callback());
// паралельная сущность
const wsServer = new WebSocketServer({ server }); // в него передаем текущий настроенный http сервер. Это сущность которая существует паралельно с основным http сервером и использует подключение для своей работ
// теперь сервер для вебсокетов встроился в наш текущий флоу работы
// const sockets = {};
// function to(user, data) {

//   if(sockets[user] && sockets[user].readyState === WebSocket.OPEN)
//       sockets[user].send(data);
// }

wsServer.on("connection", (ws) => { // прослушка соеденения (подписывание на события). Объект с поощью которого можно рассылать сообщения
  // const userId = getUserIdSomehow(ws);
  // sockets[userId] = ws;

  ws.on("message", (msg, isBinary) => {// прослушка сообщений
    console.log(1)
    const receivedMSG = JSON.parse(msg); // получить сообщение . Преобразовывает в объект JSON.parse() Статический метод анализирует строку JSON, создавая значение JavaScript или объект, описываемый строкой
    console.dir(receivedMSG); //это способ посмотреть в консоли свойства заданного javascript объекта
    // console.log('receivedMSG ' + receivedMSG);
    const {typesms} = receivedMSG;
    // console.log('typesms ' + typesms);
    //записать в массив в определенный раздел
    const obj = {
      message: receivedMSG,
      dataId: receivedMSG.dataId,
    }

    switch (typesms) {
      case 'file':
        chat.file.push(obj);
        allMessages.push(obj);
        obj.length = chat.file.length;
        break;
      case 'link':
        chat.link.push(obj);
        obj.length = chat.link.length;
        allMessages.push(obj);
        break;
      case 'text':
        chat.message.push(obj);
        obj.length = chat.message.length;
        allMessages.push(obj);
        break;
      case 'image':
        chat.image.push(obj);
        obj.length = chat.image.length;
        allMessages.push(obj);
        break;
      case 'video':
        chat.video.push(obj);
        obj.length = chat.video.length;
        allMessages.push(obj);
        break;
      case 'audio':
        chat.audio.push(obj);
        obj.length = chat.audio.length;
        allMessages.push(obj);
        break;
    }

    //ВЫХОД УЧАСТНИКА
    if (receivedMSG.type === "exit") { // выход, если кто-то хочет ути с чата(отключится?)
      console.log(2);
      const idx = userState.findIndex( // находим такое имя в списке
        (user) => user.name === receivedMSG.name
      );
      userState.splice(idx, 1); // удоляем его из списка
      [...wsServer.clients] // wsServer.clients
        .filter((o) => o.readyState === WS.OPEN) // фильтруем масив и оставляем только тех кто открыт (есть онлайн)
        .forEach((o) => o.send(JSON.stringify(userState))); // // отправляем каждому список оставшихся собеседников
      return;
    }
    
    //ОТПРАВКА СООБЩЕНИЙ
    if (receivedMSG.type === "send") { // отправить
      console.log(3);
      [...wsServer.clients] // массив со всеми участниками
        .filter((o) => o.readyState === WS.OPEN) // смотрим чтоб все были в сети
        .forEach((o) => o.send(msg, { binary: isBinary })); // отправляем каждому сообщение, чтоб отображалось. Что это за метод{ binary: isBinary }?
    }

        //ОТПРАВКА СООБЩЕНИЙ
    if (receivedMSG.type === "sendAll") { // отправить
      console.log('allsms');
      // console.log( [...wsServer.clients])

      // const userId = getUserIdSomehow(ws);
      console.log( sockets)
      let indexElem = allMessages.map((el) => el.dataId).indexOf(Number(receivedMSG.dataId));
      let listMessege = allMessages.slice(0, indexElem);
      if (listMessege.length < 10) {

        if(userState[user] && userState[user].readyState === WebSocket.OPEN)
        userState[user].send(data);
      } else {

      }
    }

  });

  

  [...wsServer.clients]// массив со всеми участниками
    .filter((o) => o.readyState === WS.OPEN) // отфильтровывает и оставляет тех кто в сети
    .forEach((o) => o.send(JSON.stringify(userState))); // отправляем каждому список оставшихся собеседников
});





server.listen(port);
console.log(`The server started on port ${port}`); 