// App.js
const AppJs = `
import * as Switch from '@radix-ui/react-switch';
import Hello from './Hello.js'

export default function App () {
  return <Hello name="Chris" />
}
`
  
// Hello.js
const HelloJs = `export default function Hello ({ name }) {
  return <h1>Hello {name}</h1>
}
`
  
// Location of file as key (always starts with /)
export const files = {
  '/App.js': {
    code: AppJs
  },
  '/Hello.js': {
    code: HelloJs
  }
}



// App.js
import * as Switch from '@radix-ui/react-switch';

const Banana = `
import * as Switch from '@radix-ui/react-switch';

export default function App () {
  return(
    <>hello</>
  )
}
`