import { Viewfinder } from '@dfosco/storyboard-react'

const pageModules = import.meta.glob('/src/prototypes/*/*.jsx')

export default function IndexPage() {
  return (
    <Viewfinder
      title="Storyboard"
      pageModules={pageModules}
      basePath={import.meta.env.BASE_URL}
    />
  )
}
