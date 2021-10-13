const EventEmitter = require('events');
const express = require('express');

const app = express();
const emitter = new EventEmitter()

const PORT = process.env.PORT || 3000;

const configs = require('./config.json')

app.use(express.json());

app.post('/', (req, res) => {
  if(configs.verifyRequests && req.headers.secret != process.env.SECRET) return res.sendStatus(401);
  emitter.emit('new', req.body.id)
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
})

module.exports = emitter