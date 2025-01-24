import {Hono} from 'hono';
import bcrypt from 'bcryptjs';

export type env = {
    DB: D1Database;
}
const client = new Hono<{Bindings:env}>();

const hashPassword = async (password:any) => {
    const salt = bcrypt.genSaltSync(10); // Generate salt
    return bcrypt.hashSync(password, salt); // Hash password
  };

client.get('/',(c)=>{

        if(!c.env.DB){
            return c.json({message:'Database is not initilized'},500)
        }
        return c.text('client side working',200);
})

client.post('/signup',async (c)=>{
    try{
        const { username, password } = await c.req.json();
        if (!username || !password) {
            return c.json({ message: 'Username and password are required.' }, 400);
          }
        // Check if username already exists
        const existingUser = await c.env.DB
          .prepare('SELECT * FROM register WHERE username = ?')
          .bind(username)
          .first();
    
        if (existingUser) {
          return c.json({ message: 'Username already taken' }, 400);
        }
        const hasspass = await hashPassword(password)
        await c.env.DB.prepare('insert into register (username,password) values (?,?)')
        .bind(username,hasspass)
        .run();
        return c.json({ message: 'Account created successfully' }, 201);
        }
        catch(error){
            return c.json(
            {
            message:
            "can not create account",error:error instanceof Error && error.message.includes(
                'UNIQUE constraint failed')?"username already taken":"undefined error"
            },400
        );
    }
})

client.post('/login',async (c)=>{
  try{
    const { username, password } = await c.req.json();
    if (!username || !password) {
        return c.json({ message: 'Username and password are required.' }, 400);
      }
    // Check if username already exists
    const existingUser = await c.env.DB
      .prepare('SELECT * FROM register WHERE username = ?')
      .bind(username)
      .first<{username:string,password:string}>();

    if (!existingUser) {
      throw new Error('username does not exists');
    }
    const isPasswordValid = bcrypt.compareSync(password, existingUser.password);
    if(!isPasswordValid){
      throw new Error('wrong Passsword');
    }
    return c.json({message:'login successfull'},200);
  }
    catch(error){
        return c.json(
        {
        message:
        "can not create account",error:error instanceof Error && error.message.includes(
            'UNIQUE constraint failed')?"username already taken":"undefined error"
        },400
    );
}

})


export default client;