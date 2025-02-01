import { Hono } from "hono";
import { cors } from "hono/cors";
import server from './server';
import client from './client'
const app = new Hono();

app.use(
  '/*',
  cors({
    origin: 'https://vercel.com/kunals-projects-9ccab660/to-do/B5VhWQVt4sVPXKeZMCp4Qv6Jb5h4', // Allow all origins (change this to specific domains for better security)
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