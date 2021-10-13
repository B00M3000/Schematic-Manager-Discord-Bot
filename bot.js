const { Client, MessageEmbed, MessageAttachment } = require('discord.js')
const EventEmitter = require('events');
const client = new Client();
const bot = new EventEmitter();
const SchematicSchema = require('./schemas/Schematic.js')
const ReviewSchematicSchema = require('./schemas/ReviewSchematic.js')

const configs = require('./config.json')
const votingChannelID = configs.votingChannelID
let votingChannel;

const VOTING_EMBEDS = {
  START: function(endTimeString){
    return new MessageEmbed()
      .setTitle("Vote for the Schematic Above!")
      .setDescription(`Click the thumbs up if you approve of the schematic. Click the thumbs down if you disprove the schematic. \n\n Voting Ends: ${endTimeString}`)
      .setColor('GREEN')
  }
}

async function createVotingSession(id){
  const result = await SchematicSchema.findOne({_id:id});
  if(result) {
    const currTime = new Date().getTime()
    const endTime = new Date(currTime + 86400000)

    const schematicEmbed = new SchematicEmbed(result)
    await votingChannel.send(schematicEmbed.embed())

    const votingMessage = await votingChannel.send(VOTING_EMBEDS.START(endTime.toUTCString()))
    await votingMessage.react('👍')
    await votingMessage.react('👎')

    const rss = new ReviewSchematicSchema({
      endTime,
      votingMessageID: votingMessage.id
    })

    const rsss = await ReviewSchematicSchema.findOneAndUpdate(rss, { upsert: true })

    return rsss._id.toString()
  } else return null
}

// client.on('messageReactionAdd', async (reaction, user) => {
//   reaction.message.channel.send('recived')
// })

client.once('ready', async () => {
	console.log(`Logged in as ${client.user.tag}`);
  votingChannel = client.channels.cache.get(votingChannelID)
  // const all = await ReviewSchematicSchema.find({})
  // console.log(all)
  // all.forEach(async r => {
  //   votingChannel.messages.fetch(r.votingChannelID, true)
  // })
});

client.on('message', async message => {
  if(message.author.bot || !message.guild) return; 
  
  const args = message.content.slice("???".length).split(/ +/);
  const cmd = args.shift().toLowerCase();

  if(cmd == "end"){ message.channel.send('hi') }
})

client.login(process.env.DISCORD_CLIENT_TOKEN)

class SchematicEmbed {
  constructor(schematic){
    this.schematic = schematic
  }
  embed(){
    const imageAttachment = new MessageAttachment(this.schematic.image.Data, `schematic.png`)
    const embed = new MessageEmbed()
    embed.setTitle(this.schematic.name)
    embed.setColor('NAVY')
    embed.attachFiles([imageAttachment])
    embed.setImage('attachment://schematic.png')
    embed.setFooter(`Created by ${this.schematic.creator}`)
    return embed;
  }
}

module.exports = { createVotingSession }