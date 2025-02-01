import {Hono} from 'hono';
export type env = {
    DB:D1Database;
}
const server = new Hono<{Bindings:env}>();

server.get('/users', async (c)=>{
    try{
      if(!c.env.DB){
        throw new Error('Database is not initialized.');
      }
      const data = await c.env.DB.prepare('select * from register').all();
      return c.json(data.results);
    }
    catch(error){
      return c.json({
        message:"can not fetch data",
        error:error instanceof Error? error.message: "Unknown error"},500)
    }
  })



  // server.delete('/delete', async (c)=>{
  //   try{
  //   await c.env.DB.prepare('delete from register').all();
  //   }
  //   catch(error){
  //     return c.text("can not delete");
  //   }
  //   return c.json({
  //     message : "deleted all"
  //   },200)
  // })
export default server;