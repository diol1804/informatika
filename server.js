// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Register user (id should be provided by client)
app.post('/api/users', async (req, res) => {
  const { id, name, class: cls, teacher } = req.body;
  if (!id || !name) return res.status(400).json({ error: "id and name required" });
  try{
    await db.query(
      `INSERT INTO users(id,name,class,teacher) VALUES($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, class = EXCLUDED.class, teacher = EXCLUDED.teacher`,
      [id,name,cls,teacher]
    );
    res.json({ ok:true });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Post result
app.post('/api/results', async (req,res) => {
  const { id, userId, userName, cls, teacher, level, score, date } = req.body;
  if(!id || !userId) return res.status(400).json({ error: 'id and userId required' });
  try{
    await db.query(
      `INSERT INTO results(id, user_id, user_name, class, teacher, level, score, created_at)
       VALUES($1,$2,$3,$4,$5,$6,$7, to_timestamp($8/1000.0))`,
      [id, userId, userName, cls, teacher, level, score, date || Date.now()]
    );
    res.json({ ok:true });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Get results (optional filter ?teacher=)
app.get('/api/results', async (req,res) => {
  const teacher = req.query.teacher;
  try{
    const q = teacher ? `SELECT * FROM results WHERE teacher = $1 ORDER BY created_at DESC LIMIT 1000` : `SELECT * FROM results ORDER BY created_at DESC LIMIT 1000`;
    const params = teacher ? [teacher] : [];
    const { rows } = await db.query(q, params);
    res.json({ ok:true, data: rows });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// get users
app.get('/api/users', async (req,res) => {
  try{
    const { rows } = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ ok:true, data: rows });
  }catch(e){
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));
