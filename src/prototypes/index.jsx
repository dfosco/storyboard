import ViewfinderNew from '@dfosco/storyboard-react/ViewfinderNew'

const pageModules = import.meta.glob('/src/prototypes/*/*.jsx')

export default function IndexPage() {
  return (
    <ViewfinderNew
      title="Storyboard"
      pageModules={pageModules}
      basePath={import.meta.env.BASE_URL}
    />
  )
}
