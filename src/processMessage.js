import roomTypes from './roomTypes'
import createFlags from './flags'
import menu from './menu'

export default ({
  err,
  message,
  messageOptions,
  lastUpdate,
  ignoreFlags,
  bot,
  loggers,
  driver
}) => {
  const {
    getRoomName, sendToRoomId, sendDirectToUser,
    disconnect, unsubscribeAll, setReaction
  } = driver
  const flags = createFlags(bot, message, messageOptions, lastUpdate)
  const rawEvent = { err, message, messageOptions }
  if (ignoreFlags.filter(f => flags[f]).length > 0) { return }
  const roomName = async () => getRoomName(message.rid)
  const respond = async content => sendToRoomId(content, message.rid)
  const respondDirect = async content => sendDirectToUser(content, message.u.username)
  const wrapLog = (name, fn) => async (...args) => {
    loggers.bot.info([`[ ${name} ]`, ...args].join(' | '))
    return fn(...args)
  }
  return {
    flags: { ...flags },
    trueFlags: Object.keys(flags).filter(f => flags[f]),
    // bot state
    bot: { ...bot },
    message: {
      id: message._id,
      unread: message.unread,
      content: message.msg,
      mentions: message.mentions,
      author: { ...message.u },
      timestamp: message.ts.$date
    },
    room: {
      id: message.rid,
      getName: roomName,
      type: roomTypes[messageOptions.roomType]
    },
    lastUpdate,
    respond: wrapLog('respond', respond),
    respondToUser: wrapLog('respond direct', respondDirect),
    sendToRoom: wrapLog('sendToRoom', driver.sendToRoom),
    sendDirectToUser: wrapLog('send to user direct', driver.sendDirectToUser),
    log: loggers.user,
    loggers: loggers,
    disconnect,
    unsubscribeAll,
    setReaction,
    // Raw rocketchat driver/response
    raw: { driver, event: { ...rawEvent } },
    ops: {
      menu
    }
  }
}
