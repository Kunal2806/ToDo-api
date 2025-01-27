import { Context, Hono, Next } from 'hono';
import bcrypt from 'bcryptjs';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';

type CustomContext = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: string; // Add custom property to the context
  };
};

const client = new Hono<CustomContext>();

// Signup route
client.post('/signup', async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ message: 'Username and password both are required.' },400);
    }

    // Check if username already exists
    const existingUser = await c.env.DB.prepare('SELECT * FROM register WHERE username = ?')
      .bind(username)
      .first();

    if (existingUser) {
      return c.json({ message: 'Username already taken' }, 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    await c.env.DB.prepare('INSERT INTO register (username, password) VALUES (?, ?)')
      .bind(username, hashPass)
      .run();

    return c.json({ message: 'Account created successfully' }, 201);
  } catch (error) {
    return c.json(
      {
        message: 'Cannot create account',
        error: error instanceof Error && error.message.includes('UNIQUE constraint failed')
          ? 'Username already taken'
          : 'Undefined error',
      },
      400
    );
  }
});

// Login route
client.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ message: 'Username and password are required.' }, 400);
    }

    const existingUser = await c.env.DB.prepare('SELECT * FROM register WHERE username = ?')
      .bind(username)
      .first<{ username: string; password: string }>();

    if (!existingUser) {
      return c.json({ message: 'Username does not exist' }, 400);
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return c.json({ message: 'Incorrect password' }, 400);
    }
    console.log(existingUser.username)

    setCookie(c, 'user-key', existingUser.username, {
      httpOnly: true,
      secure: true, 
      sameSite:"none",
      path: '/',
      maxAge: 86400,
      // domain: '.localhost',
    });


    return c.json({ message: 'Login successful' }, 200);
  } catch (error) {
    return c.json(
      { message: error instanceof Error ? error.message : 'Login failed' },
      400
    );
  }
});

// Middleware to verify authentication
const authMiddleware = async (c: Context<CustomContext>, next: Next) => {
  const userKey = getCookie(c, 'user-key');

  if (!userKey) {
    return c.json({ message: 'Unauthorized: Please log in.' }, 401);
  }

  // Attach the user information to the context
  c.set('user', userKey);
  await next();
};

// Protected route
// client.get('/protected/*', authMiddleware, (c) => {
//   const user = c.get('user'); // Retrieve user info from context
//   return c.json({ message: `Welcome, ${user}! This is a protected route.` });
// });

client.post('/protected/task', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const res = await c.env.DB.prepare('SELECT user_id FROM register WHERE username = ?')
      .bind(user)
      .first();

      if(!res){
        return c.json({message: "user not found"})
      }
      const user_id = res.user_id;

    const { title, task_color, alert, duedate } = await c.req.json();

    // Validate input
    if (!title || !task_color || alert === undefined || !duedate) {
      return c.json({ message: 'All fields (title, task_color, alert, duedate) must be provided' }, 400);
    }

    // Validate `duedate`
    const dueDate = new Date(duedate);
    if (isNaN(dueDate.getTime())) {
      return c.json({ message: 'Invalid due date format' }, 400);
    }

    await c.env.DB.prepare(
      'INSERT INTO task_data (user_id, title, task_color, alert, duedate) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(user_id, title, task_color, alert, dueDate.toISOString())
      .run();

    return c.json({ message: 'Task successfully added' }, 200);
  } catch (error) {
    console.error(error);
    return c.json({ message: 'An error occurred'}, 500);
  }
});

client.get('/protected/gettask', authMiddleware, async (c) => {
 
    const user = c.get('user');
    const res = await c.env.DB.prepare('SELECT user_id FROM register WHERE username = ?')
      .bind(user)
      .first();

      if(!res){
        return c.json({message: "user not found"})
      }
      const user_id = res.user_id;
    if (!user || !user_id) {
      return c.json({ message: 'User not found' }, 400);
    }
    
    const tasks = await c.env.DB.prepare('SELECT * FROM task_data WHERE user_id = ?')
      .bind(user_id)
      .all();

    return c.json(tasks.results, 200);
});

// Logout route
client.post('/logout', (c) => {
  deleteCookie(c, 'user-key', { path: '/' });
  return c.json({ message: 'Logged out successfully.' });
});

export default client;
