import { flows } from 'virtual:storyboard-data-index'
import { Viewfinder } from '@dfosco/storyboard-react'

const pageModules = import.meta.glob('/src/prototypes/*.jsx')

export default function ViewfinderPage() {
  return (
    <Viewfinder
      title="Storyboard"
      flows={flows}
      pageModules={pageModules}
      basePath={import.meta.env.BASE_URL}
    />
  )
}
