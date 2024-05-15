import supertest from 'supertest';
import app from './index.js';

const request = supertest(app);

describe('User Routes', () => {
  let userId;

  // Test for POST /users/create
  it('should create a new user', async () => {
    const newUser = {
      name: 'New User',
      email: 'newuser@example.com',
      age: 35
    };

    const res = await request.post('/create').send(newUser);

    // get all users and see if the new user is there 
    const res2 = await request.get('/');
    expect(res2.body).toContainEqual(expect.objectContaining(newUser));
    //get the new user from the list and get the id
    const user = res2.body.find(user => user.name === newUser.name);
    userId = user.id;
  });

  // Test for GET /users
  it('should get all users', async () => {
    const res = await request.get('/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test for PUT /users/update/:id
  it('should update a user', async () => {
    const updatedUserData = {
      name: 'Updated User',
      email: 'updateduser@example.com',
      age: '40'
    };

    const res = await request.put(`/update/${userId}`).send(updatedUserData);

    expect(res.text).toContain(`User with the id ${userId} has been updated`);
  });

  // Test for GET /users/view/:id
  it('should view a single user by ID', async () => {
    const res = await request.get(`/view/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', userId);
  });

  // Test for DELETE /users/delete/:id
  it('should delete a user', async () => {
    const res = await request.delete(`/delete/${userId}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain(`User with the id ${userId} deleted from the database.`);
  });
});

describe('Posts Routes', () => {
  let postId;
  let userId;
  //add an user with id 1
  const newUser = {
    name: 'New User',
    email: 'email@gmail.com',
    age: 35
  };
  request.post('/create').send(newUser);
  //get the user id after getting all  users
  request.get('/').then(res => {
    const user = res.body.find(user => user.name === newUser.name);
    userId = user.id;
  });
  //log all users
  console.log('Users: ');
  request.get('/').then(res => console.log(res.body));
  //show user id 
  console.log('User id: ' + userId);
  // Test for POST /posts/create
  it('should create a new post', async () => {
    const newPost = {
      userid: userId,
      caption: 'New Post Caption',
      Date: '2024-04-18'
    };

    const res = await request.post('/posts/create').send(newPost);
    console.log(res.body);
    //log all posts
    console.log('Posts: ');
    request.get('/posts').then(res => console.log(res.body));

    // get all posts and see if the new post is there
    const res2 = await request.get('/posts');
    //get the new post from the list and get the id
    const post = res2.body.find(post => post.caption === newPost.caption);
    postId = post.id;
  });

  // Test for GET /posts
  it('should get all posts', async () => {
    const res = await request.get('/posts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test for PUT /posts/update/:id
  it('should update a post', async () => {
    const updatedPostData = {
      userId: userId,
      caption: 'Updated Post Caption',
      Date: '2024-04-18'
    };

    const res = await request.put(`/posts/update/${postId}`).send(updatedPostData);
    //look for the post and verify caption is changed
    const res2 = await request.get(`/posts/view/${postId}`);
    expect(res2.body.caption).toBe(updatedPostData.caption);
  });

  // Test for GET /posts/view/:id
  it('should view a single post by ID', async () => {
    const res = await request.get(`/posts/view/${postId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', postId);
  });

  // Test for DELETE /posts/delete/:id
  it('should delete a post', async () => {
    const res = await request.delete(`/posts/delete/${postId}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain(`Post with the id ${postId} has been deleted`);
  });
  //delete the user at the end
  request.delete(`/delete/${userId}`);
});
