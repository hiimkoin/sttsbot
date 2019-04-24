const say = require('say')
const fs = require('fs')
const tmi = require('tmi.js')

const opts = loadJson('./config.json')
const whitelist = loadJson('./whitelist.json')

const client = new tmi.client(opts)

client.on('message', onMessageHandler)
client.on('connected', onConnectedHandler)

client.connect()

function onMessageHandler (target, context, msg, self) {
  if (self) return

  let isBroadcaster = context.badges.broadcaster === '1'
  let requester = context.username

  if (isBroadcaster || isWhitelisted(requester)) {
    let command = msg.trim()
    if (command.startsWith('!allow')) {
      if (!isBroadcaster) return
      console.log(`${requester}: ${command}`)
      let user = sanitizedUser(command)
      addUser(target, user)
    } else if (command.startsWith('!say')) {
      console.log(`${requester}: ${command}`)
      let message = command.substring(4).trim()
      say.speak(message)
    } else if (command.startsWith('!stop')) {
      say.stop()
    } else if (command.startsWith('!revoke')) {
      console.log(`${requester}: ${command}`)
      let user = sanitizedUser(command)
      revokeUser(target, user)
    }
  }
}

function sanitizedUser(cmd) {
  let user = cmd.split(' ')[1].toLowerCase()
  user = user.replace(/\@/, '')
  return user
}

function isWhitelisted(user) {
  return whitelist.includes(user)
}

function loadJson(data) {
  return JSON.parse(fs.readFileSync(data, 'utf-8'))
}

function addUser(target, user) {
  if (isWhitelisted(user)) {
    client.say(target, user + ' has already TTS')
    return
  }
  whitelist.push(user)
  saveWhitelist()
  client.say(target, user + ' granted TTS')
}

function revokeUser(target, user) {
  if (isWhitelisted(user)) {
    let i = whitelist.indexOf(user)
    if (i > -1) {
      whitelist.splice(i, 1)
    }
    saveWhitelist()
    client.say(target, "revoked " + user + " from TTS")
    return
  }
  client.say(target, "can't find " + user)
}

function saveWhitelist() {
  fs.writeFileSync('./whitelist.json', JSON.stringify(whitelist, null, 4))
}

function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`)
}
