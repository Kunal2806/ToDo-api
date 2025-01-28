import { Hono } from "hono";
import { cors } from "hono/cors";
import server from './server';
import client from './client'
const app = new Hono();

app.use(
  '/client/*',
  cors({
    origin: 'http://localhost:5173', // Allow all origins (change this to specific domains for better security)
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
    credentials: true, // Allow sending credentials (cookies, authorization headers, etc.)
  })
);

app.route('/server',server)

app.route('/client',client)

app.get('/',(c)=>{
  return c.json({message:'working'},200);
})
export default app;