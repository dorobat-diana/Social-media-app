import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import userRoutes from './routes/users.js';
import statusRoute from './routes/status.js'; 
import { createServer, get } from 'http';
import WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import postsRoutes from './routes/posts_routes.js';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import User from './models/user.model.js';
import Post from './models/posts.model.js';
import {faker} from '@faker-js/faker';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const db= 'mongodb://localhost:27017/node_crud_db';
const app = express();
//app.use(limiter);
app.use(mongoSanitize());
const port = 3030;


const server =createServer(app);
const wss = new WebSocketServer({ server:server });


app.use(bodyParser.json());
app.use(cors());

async function generateRandomUsers(numberOfUsers) {
  const users = [];
  try {
    for (let i = 0; i < numberOfUsers; i++) {
      const newUser = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        age: Math.floor(Math.random() * 61) + 20,
      };
      await User.create(newUser);
      users.push(newUser);
    }
  } catch (error) {
    console.error('Error creating users:', error);
  }
  return users;
}
//create a function for generating random posts but with already existing users 
async function generateRandomPosts(numberOfPosts) {
  const posts = [];
  try {
    const users = await User.find();
    for (let i = 0; i < numberOfPosts; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const newPost = {
        userid: randomUser.id,
        caption: faker.lorem.sentence(),
        Date: faker.date.recent(),
      }
      await Post.create(newPost);
      posts.push(newPost);
    }
  } catch (error) {
    console.error('Error creating posts:', error);
  }
  return posts;
}
wss.on('connection', (ws) => {
  console.log('A new client connected!');
  ws.send("new user added");
 
  // const interval = setInterval(async () => {

  //   //Generate random user data
  //   try {
  //     await generateRandomUsers(10000);
  //     await generateRandomPosts(10000);
  //   } catch (error) {
  //     console.error('Error creating user:', error);
  //   }

  //   wss.clients.forEach((client) => {
  //     if (client.readyState === WebSocket.OPEN) {
  //       client.send("new user added");
  //     }
  //   });
  // }, 1000); // Send every 20 seconds

  ws.on('close', () => {
    console.log('Client disconnected');
    //clearInterval(interval);
   
  });
});


 server.listen(port, () => {
   console.log(`Server running on port ${port}`);
 });

mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {console.log('MongoDB connected...');
})
  .catch(err => console.log(err));

app.use('/', userRoutes);
app.use('/status', statusRoute);
app.use('/posts', postsRoutes);

app.all('*', (req, res) => {    
  res.send('404. Page not found!');
});


export default app;
export { wss};