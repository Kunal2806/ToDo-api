import {Hono} from 'hono';
import bcrypt from 'bcryptjs';
import { setCookie } from 'hono/cookie';

export type env = {
    DB: D1Database;
}
const client = new Hono<{Bindings:env}>();


client.get('/',(c)=>{

        if(!c.env.DB){
            return c.json({message:'Database is not initilized'},500)
        }
        return c.text('client side working',200);
})

client.post('/signup', async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ message: 'Username and password are required.' }, 400);
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

    setCookie(c, 'user-key', existingUser.username, {
      httpOnly: true,
      secure: false, // Use secure: true in production with HTTPS
      path: '/',
      maxAge: 0, // 1 day
    });

    return c.json({ message: 'Login successful' }, 200);
  } catch (error) {
    return c.json(
      { message: error instanceof Error ? error.message : 'Login failed' },
      400
    );
  }
});



export default client;