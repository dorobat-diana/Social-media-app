import User from '../models/user.model.js';
import mongoSanitize from 'express-mongo-sanitize';
import {wss} from '../index.js';
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
export const getUsers = async (req, res) => {
  const page = req.query.curPage ? parseInt(req.query.curPage) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 50;


  try {
    const totalCount = await User.countDocuments();
    const totalPages = Math.ceil(totalCount / pageSize);

    const users = await User.aggregate([
      {
        $sort: { age: 1 } // Sort users in ascending order by age
      },
      {
        $skip: (page - 1) * pageSize
      },
      {
        $limit: pageSize
      },
      {
        $lookup: {
          from: 'posts',
          localField: 'id',
          foreignField: 'userid',
          as: 'posts'
        }
      },
      {
        $project: {
          id: 1,
          name: 1,
          email: 1,
          age: 1,
          postCount: { $size: '$posts' } // Count the number of posts for each user
        }
      }
    ]);

    
    res.json({ users, totalPages });
  } catch (error) {
    console.error('Error fetching users from the database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req, res) => {    
  const user = req.body;
  const { name, email, age,password } = req.body;
  // Check if required fields are present
if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !age || !password ) {
    return res.status(400).json({ error: 'Invalid data. Name (string), email (string), and age (number) are required.' });
}
// Validate email format
if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
}
//validate that inside the string age there are online nu,bers
if (isNaN(age)) {
    return res.status(400).json({ error: 'Invalid age. Age must be a number.' });
}
const sanitizedUser = mongoSanitize.sanitize(user);
try {
  //create the user but add a unique id
  const newUser = await User.create(sanitizedUser);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("new user added");
    }
  });
} catch (error) {
  console.error('Error creating user:', error);
  return res.status(400).json({ error: 'Error creating user.' });
} 
  res.send(`User added to the database!`);
}
export const getUser = async (req, res) => {
  const { id } = req.params;
  try{
  const foundUser = await User.findOne({id:id});
 
  if (!foundUser) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.send(foundUser);
}catch (error) {
  console.error('Error fetching user:', error);
  res.status(500).json({ error: 'Error fetching user.' });
}};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await User.findOneAndDelete({id:id});
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("new user added");
      }
    });
    res.send(`User with the id ${id} deleted from the database.`);
} catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting user.' });
    throw new Error('Error deleting user.');
}
};
export const SyncData = async (req, res) => {
  const users = req.body;

  
  try {
    for (const user of users) {
      const existingUser = await User.findOne({ id: user.id });

      if (existingUser) {
        if (user.id && !user.name && !user.email && !user.age) {
          // If user ID exists but no other data, delete the user
          await User.findOneAndDelete({ id: user.id });
        } else {
          // If user already exists, update it
          await User.findOneAndUpdate({ id: user.id }, user);
        }
      } else {
        // If user doesn't exist, create it
        await User.create(user);
      }
    }

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("new user added");
      }
    });

    res.send('Data synced successfully.');
  } catch (error) {
    console.error('Error syncing data:', error);
    res.status(500).json({ error: 'Error syncing data.' });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;

  // Validate the user input
  const { name, email, age, password } = req.body;

  // Check if required fields are present
  if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !age || !password) {
    return res.status(400).json({ error: 'Invalid data. Name (string), email (string), and age (number) are required.' });
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  // Validate that 'age' is a number
  if (isNaN(age)) {
    return res.status(400).json({ error: 'Invalid age. Age must be a number.' });
  }

  const sanitizedUser = mongoSanitize.sanitize(req.body);
  try {

    const updatedUser = await User.findOneAndUpdate({id:id}, sanitizedUser, { new: true });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("new user added");
      }
    });

    if (updatedUser) {
      res.send(`User with the id ${id} has been updated.`);
    } else {
      res.send(`User with the id ${id} not found in the database.`);
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error updating user.' });
  }


  // Write the updated users array to the JSON file

};
    // Helper function to validate email format
const validateEmail = (email) => {
    // Regular expression for basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  export const getAllUsersForChart = async (req, res) => {
    try {
      const users = await User.aggregate([
        {
          $group: {
            _id: '$age',
            count: { $sum: 1 }
          }
        }
      ]);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users for chart:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  export const verifyUser = async (req, res) => {
    const { email, password } = req.params;
    console.log(email,password);
    // Check if required fields are present
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      console.log('Invalid data. Email (string) and password (string) are required.');
      return res.status(400).json({ error: 'Invalid data. Email (string) and password (string) are required.' });
      
    }
  
    // Validate email format
    if (!validateEmail(email)) {
      console.log('Invalid email format.');
      return res.status(400).json({ error: 'Invalid email format.' });
    }
  
    // Check if user with the given email and username exists
    const user = await User.findOne({ email:email, password:password });
  
    if (user) {
      console.log('User found:', user)
      const token = jwt.sign({ userId: user.id }, 'your_secret_key', { expiresIn: '1h' });
      return res.json({ token });
    } else {
      console.log('User not found.');
      res.status(400).json({ error: 'User not found.' });
    }
  };

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: 'No token provided.' });
    }

    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Failed to authenticate token.' });
        }

        req.userId = decoded.id;
        next();
    });
};
export const getAuthenticatedUserId = async (req, res) => {
  //verify if token has expired

    const token = req.headers.authorization;
    console.log(token);
    if (!token) {
      console.log('No token provided.');
        return res.status(401).json({ error: 'No token provided.' });
    }

    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) {
          console.log('Failed to authenticate token.');
            return res.status(401).json({ error: 'Failed to authenticate token.' });
        }
        console.log(decoded.userId);
        res.json({ id: decoded.userId });
    });
};

  
