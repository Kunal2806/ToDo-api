import { Hono } from "hono";
import { cors } from "hono/cors";
import server from './server';
import todo from './client'
const app = new Hono();

app.use('/todo/*',
  cors()
)

app.route('/server',server)

app.route('/todo',todo)

app.get('/',(c)=>{
  return c.json({message:'working'},200);
})
export default app;