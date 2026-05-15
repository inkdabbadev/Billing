import { Font } from '@react-pdf/renderer'
import path from 'path'

let registered = false

export function registerFonts() {
  if (registered) return
  registered = true

  Font.register({
    family: 'Roboto',
    fonts: [
      {
        src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf'),
        fontWeight: 'normal',
      },
      {
        src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf'),
        fontWeight: 'bold',
      },
    ],
  })
}
