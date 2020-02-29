import { driver } from '@rocket.chat/sdk'
import wrapEvent from './wrapEvent'
import createLoggers from './logger'
import prettyPrint from './prettyPrint'
import roomTypes from './roomTypes'
import createIgnoreFlags from './ignoreFlags'


export default async ({
  host = '',
  username = '',
  password,
  ssl: useSsl = true,
  rooms: _rooms,
  // run on wake
  wake,
  // run on 
  process,
  colors = true,
  pretty = true,
  loggers = null,
  logLevel = 'debug',
  // pass a function here to ignore messages you can't ignore with flags
  filterFn = () => true,
  // flags:
  // pass empty array to disable defaults
  // WARNING: not recommended
  ignoreFlags = ['fromSelf', 'read', 'notInRoom'],
}) => {
  if (!loggers)
    loggers = createLoggers({colors, level: logLevel, username})
  if (!colors && pretty) {
    loggers.bot.warn('[ invalid options ] pretty setting requires colors. disabling...')
    pretty = false
  }
  driver.useLog(loggers.rocket)
  await driver.connect({ host, useSsl })
  const id = await driver.login({ username, password })
  await driver.joinRooms(_rooms)
  await driver.subscribeToMessages()
  const bootDate = Date.now()
  const bot = { id, username, bootDate }
  let lastUpdate = bootDate
  loggers.bot.debug('[ wake ] waking up')
  await wake({
    log: loggers.user,
    loggers: loggers,
    bot: { ...bot }
  })
  loggers.bot.debug('[ reacting ] reacting to messages')
  driver.reactToMessages( async (err, message, messageOptions) => {
    const flags = createIgnoreFlags(
      bot, message, messageOptions, lastUpdate)
    const event = wrapEvent({
      err,
      flags,
      message,
      messageOptions,
      lastUpdate,
      ignoreFlags,
      bot,
      loggers,
      driver,
    })
    const trueFlags = Object.keys(flags)
      .filter(f => flags[f])
    if (event && filterFn(event)) {
      if (pretty) {
        const roomName = await event.room.getName(event.room.id)
        console.log([
            prettyPrint.eventNotifier(),
            '\n',
            prettyPrint.ignoreFlags(trueFlags),
            prettyPrint.room(roomName, event.room.type),
            prettyPrint.name(message.u.name),
            '\n',
            prettyPrint.content(message.msg)
          ].join('')
        )
      }
      await process(event)
      if (pretty)
        console.log(prettyPrint.eventEndNotifier())
    } else if (loggers.bot.level === 'debug') {
      const roomName = await driver.getRoomName(message.rid)
      loggers.bot.debug('[ignored event]' +
        ` (${ prettyPrint.format.roomText(
          roomName, roomTypes[messageOptions.roomType]) }) ` + 
      [ message.u.name, message.msg ].join(': ') + ' -- ' +
      trueFlags.join(' '))
    }
    lastUpdate = Date.now()
  })
}
