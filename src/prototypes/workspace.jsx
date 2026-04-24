import { flows } from 'virtual:storyboard-data-index'
import { Viewfinder } from '@dfosco/storyboard-react'

const pageModules = import.meta.glob('/src/prototypes/*.jsx')

export default function WorkspacePage() {
  return (
    <Viewfinder
      title="Storyboard"
      subtitle="Where design work goes"
      flows={flows}
      hideDefaultFlow={true}
      pageModules={pageModules}
      basePath={import.meta.env.BASE_URL}
    />
  )
}
