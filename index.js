require('dotenv').config();
const server = require('./server.js')
const bot = require('./bot.js')
const mongo = require('./mongo')

const ReviewSchematicSchema = require('./schemas/ReviewSchematic.js')
ReviewSchematicSchema.find({})
  .then(result => {
    console.log(result.)
  })

mongo().then(() => {
  console.log("Mongo Connection Established")
})

server.on('new', async id => {
  const result = await bot.createVotingSession(id)
  console.log(result)
})