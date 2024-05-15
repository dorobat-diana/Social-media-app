import jwt from 'jsonwebtoken';
import { v4 as uuid } from "uuid";
import {wss} from '../index.js';
import mongoSanitize from 'express-mongo-sanitize';
import Post from '../models/posts.model.js';
import WebSocket from 'ws';
import { tr } from "@faker-js/faker";
export const getUserPosts = async (req, res) => {
  try {
    const token = req.headers.authorization; // Extract the JWT token from the request header
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Token is missing.' });
    }

    jwt.verify(token, 'your_secret_key', async (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
      }
      const userId = decoded.userId;
      // Token is valid, you can proceed to fetch posts
      const page = req.query.curPostPage ? parseInt(req.query.curPostPage) : 1;
      const pageSize = req.query.postPageSize ? parseInt(req.query.postPageSize) : 50;
      // Fetch posts belonging to the user with the extracted user ID and apply pagination
      const posts = await Post.find({ userid: userId })
           .skip((page - 1) * pageSize) // Calculate the number of documents to skip
           .limit(pageSize); // Limit the number of documents returned per page

    
      res.send(posts);
    });
  } catch (error) {
    console.error('Error fetching posts from the database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
export const getPosts = async (req, res) => {
    const page = req.query.curPostPage ? parseInt(req.query.curPostPage) : 1;
    const pageSize = req.query.postPageSize ? parseInt(req.query.postPageSize) : 50;
    try {
      const totalCount = await Post.countDocuments();
      const totalPages = Math.ceil(totalCount / pageSize);
      const posts = await Post.aggregate([
        {
          $skip: (page - 1) * pageSize
        },
        {
          $limit: pageSize
        }
      ]);
      res.send(posts);
    } catch (error) {
      console.error('Error fetching posts from the database:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  
export const createPost = async (req, res) => {
    const post = req.body;
    const { userid, caption, Date } = req.body;
    //show exact error
    if(!userid){
      return res.status(400).json({ error: 'Invalid data. User ID is required.' });
    }
    //verify is user id is a string)
    if (typeof userid !== 'string') {
      return res.status(400).json({ error: 'Invalid data. User ID must be a string.' });
    }
    //same for the other 3 separate fields  
    if(!caption){
      return res.status(400).json({ error: 'Invalid data. Caption is required.' });
    }
    if (typeof caption !== 'string') {
      return res.status(400).json({ error: 'Invalid data. Caption must be a string.' });
    }
    if(!Date){
      return res.status(400).json({ error: 'Invalid data. Date is required.' });
    }
    const sanitizedPost = mongoSanitize.sanitize(post);
    try {
      const newPost = await Post.create(sanitizedPost);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send("new post added");
        }
      });
      res.status(201).json(newPost); 
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Error creating post.');
    }
  }

export const deletePost = async (req, res) => {
    const { id } = req.params;
    try {
      const deletedPost = await Post.findOneAndDelete({ id: id });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send("new post added");
        }
      });
      if (!deletedPost) {
        return res.status(404).json({ error: 'Post not found.' });
      }
      res.send(`Post with the id ${id} has been deleted`);
    }
    catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ error: 'Error deleting post.' });
    }
  }

  export const syncPosts = async (req, res) => {
    const posts = req.body;


    try {
      for (const post of posts) {
        const existingPost = await Post.findOne({ id: post.id });
        
        if (existingPost) {
          if (post.id && !post.userid && !post.caption && !post.Date) {
            await Post.findOneAndDelete({ id: post.id });
          } else {
            await Post.findOneAndUpdate({ id: post.id }, post);
          }
        } else {
          await Post.create(post);
        }
      }
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send("new post added");
        }
      });
      res.send('Posts synced successfully.');
    }
    catch (error) {
      console.error('Error syncing posts:', error);
      res.status(500).json({ error: 'Error syncing posts.' });
    }

  };

export const updatePost = async (req, res) => {
    const { id } = req.params;
    const { caption, Date } = req.body;
    if (!caption || typeof caption !== 'string' || !Date ) {
      return res.status(400).json({ error: 'Invalid data. Caption (string) and date (string) are required.' });
    }
    const sanitizedPost = mongoSanitize.sanitize(req.body);
    try {
      const updatedPost = await Post.findOneAndUpdate({ id: id }, sanitizedPost, { new: true });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send("new post added");
        }
      });
      if (!updatedPost) {
        return res.status(404).json({ error: 'Post not found.' });
      }
      res.send(updatedPost);
    }
    catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ error: 'Error updating post.' });
    }
  }
  export const getPost = async (req, res) => {
    const { id } = req.params;
    try {
      const foundPost = await Post.findOne({ id: id });
      if (!foundPost) {
        return res.status(404).json({ error: 'Post not found.' });
      }
      res.send(foundPost);
    }
    catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ error: 'Error fetching post.' });
    }
  }