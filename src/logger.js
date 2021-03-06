import winston from 'winston'
import c from 'chalk'

const logFormatColor = (tag, tagColor) => winston.format.printf(
  ({ level, message }) => {
    const lColor =
      level === 'info' ? tagColor
        : level === 'warning' ? c.redBright
          : level === 'debug' ? c.blue
            : level === 'error' ? c.red
              : c.white
    return `${tagColor(`[[ ${tag} ]]`)} ${lColor(`${message}`)}`
  })
const logFormat = tag => winston.format.printf(({ message }) => `[[ ${tag} ]] ${message}`)
const createFormat = (tag, useColor, color) =>
  useColor
    ? logFormatColor(tag, color)
    : logFormat(tag)

export default ({
  colors = true,
  levels = {},
  username = 'user'
}) => ({
  rocket: winston.createLogger({
    format: createFormat('rocket', colors, c.grey),
    transports: [new winston.transports.Console()],
    level: levels.rocket
  }),
  bot: winston.createLogger({
    format: createFormat('bot', colors, c.cyan),
    transports: [new winston.transports.Console()],
    level: levels.bot
  }),
  user: winston.createLogger({
    format: createFormat(username, colors, c.cyanBright),
    transports: [new winston.transports.Console()],
    level: levels.user
  })
})
