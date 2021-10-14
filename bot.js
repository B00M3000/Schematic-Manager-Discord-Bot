const { Client, MessageEmbed, MessageAttachment } = require('discord.js')
const EventEmitter = require('events');
const client = new Client();
const bot = new EventEmitter();
const SchematicSchema = require('./schemas/Schematic.js')
const ReviewSchematicSchema = require('./schemas/ReviewSchematic.js')

const configs = require('./config.json')
const votingChannelID = configs.votingChannelID
let votingChannel;


let currentlyActive; 

const VOTING_EMBEDS = {
  START: function(endTimeString){
    return new MessageEmbed()
      .setTitle("Vote for the Schematic Above!")
      .setDescription(`Click the thumbs up if you approve of the schematic. Click the thumbs down if you disprove the schematic. Your votes will be discarded if you vote twice. \n\n Voting Ends: ${endTimeString}, which is also 24 hours from the time this message is sent.`)
      .setColor('GREEN')
  },
  END: function(endTime, u, d){
    const r = u > d
    return new MessageEmbed()
      .setTitle(r ? "The schematic above was approved" : "The schematic above was declined")
      .setDescription(`The voting for this schematic ended ${endTime}. The final results were ${u} up votes, ${d} down votes`)
      .setColor(r ? 'GREEN' : 'RED')
  }
}

async function createVotingSession(id){
  const result = await SchematicSchema.findOne({_id:id});
  if(result) {
    const currTime = new Date().getTime()
    const endTime = new Date(currTime + 20000)//86400000)

    let schematicEmbed = new SchematicEmbed(result)
    await votingChannel.send(schematicEmbed.embed())

    const votingMessage = await votingChannel.send(VOTING_EMBEDS.START(endTime.toUTCString()))
    await votingMessage.react('👍')
    await votingMessage.react('👎')

    const rss = new ReviewSchematicSchema({
      endTime,
      votingMessageID: votingMessage.id
    })

    const rsss = await ReviewSchematicSchema.findOneAndUpdate({status: "non-existant"}, rss, { upsert: true, new: true })    

    currentlyActive.push(rsss)

    setTimeout(function(){
      endVoting(rsss)
    }, rsss.endTime - (new Date().getTime()))

    await votingMessage.edit(VOTING_EMBEDS.START(endTime.toUTCString()).setFooter(rsss._id.toString()))

    return rsss._id.toString()
  } else return null
}

client.once('ready', async () => {
	console.log(`Logged in as ${client.user.tag}`);
  votingChannel = client.channels.cache.get(votingChannelID)
  currentlyActive = await ReviewSchematicSchema.find({status: "currently_voting_on"})
  currentlyActive.forEach(c => {
    if(c.endTime < new Date().getTime()) endVoting(c)
    setTimeout(function(){
      endVoting(c)
    }, c.endTime - (new Date().getTime()))
  })
});

async function endVoting(c){
  const message = await votingChannel.messages.fetch(c.votingMessageID)
  if(!message) return false
  const remoteData = await ReviewSchematicSchema.findOne({_id: c._id})
  if(remoteData != "currently_voting_on") return false
  const upVoteUsers = await message.reactions.resolve('👍').users.fetch()
  const downVoteUsers= await message.reactions.resolve('👎').users.fetch()
  let upVoteUserIDs = upVoteUsers.map(u => u.id)
  let downVoteUserIDs = downVoteUsers.map(u => u.id)
  let duplicates = 1;
  upVoteUserIDs = upVoteUserIDs.filter(val => {
    if(downVoteUserIDs.indexOf(val)) duplicates++;
    return true;
  });

  const upvotes = upVoteUserIDs.length - duplicates
  const downvotes = downVoteUserIDs.length - duplicates
  
  await message.edit(VOTING_EMBEDS.END(new Date(c.endTime).toUTCString(), upvotes, downvotes))

  ReviewSchematicSchema.findOneAndUpdate({_id: c._id}, {status: upvotes > downvotes ? "approved" : "declined", resultUp: upvotes, resultDown: downvotes}, {new: true})
}

client.on('message', async message => {
  if(message.author.bot || !message.guild) return; 
  
  const args = message.content.slice("???".length).split(/ +/);
  const cmd = args.shift().toLowerCase();

  if(cmd == "end"){ 
    const c = currentlyActive.find(c => c._id == args[0])
    if(!c) return
    console.log(c)
    endVoting(c)
  }
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

class SchematicEmbedD {
  constructor(schematic, rid){
    this.schematic = schematic
    this.rid = rid
  }
  embed(){
    const imageAttachment = new MessageAttachment(this.schematic.image.Data, `schematic.png`)
    const embed = new MessageEmbed()
    embed.setTitle(this.schematic.name)
    embed.setColor('NAVY')
    embed.attachFiles([imageAttachment])
    embed.setImage('attachment://schematic.png')
    embed.setFooter(`Created by ${this.schematic.creator} • ${this.rid}`)
    return embed;
  }
}

module.exports = { createVotingSession }