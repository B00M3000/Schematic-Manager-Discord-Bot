require('dotenv').config();
const server = require('./server.js')
const bot = require('./bot.js')
const mongo = require('./mongo')

mongo().then(() => {
  console.log("Mongo Connection Established")
})

server.on('new', async id => {
  const result = await bot.createVotingSession(id)
  server.emit('new:'+id, result)
})