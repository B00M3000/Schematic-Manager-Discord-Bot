const EventEmitter = require('events');
const express = require('express');

const app = express();
const emitter = new EventEmitter()
const ReviewSchematicSchema = require('./schemas/ReviewSchematic.js')

const PORT = process.env.PORT || 3000;

const configs = require('./config.json')

app.use(express.json());

app.post('/', async (req, res) => {
  if(configs.verifyRequests && req.headers.secret != process.env.SECRET) return res.sendStatus(401);
  emitter.emit('new', req.body.id)
  emitter.once('new:'+req.body.id, rid => {
    res.send(rid)
  })
})

app.get('/', async (req, res) => {
  if(!req.query || !req.query.id){
    const all = await ReviewSchematicSchema.find()
    res.send(all)
  } else {
    const result = await ReviewSchematicSchema.find({_id:req.query.id})
    res.send(result)
  }
})

app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
})

module.exports = emitter