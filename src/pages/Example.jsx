import { Text, Button, ButtonGroup, FormControl } from '@primer/react'
import { useOverride, useScene } from '@dfosco/storyboard-react'
import ColorModeSwitcher from '../components/ColorModeSwitcher.jsx'
import StoryboardForm from '../components/StoryboardForm.jsx'
import TextInput from '../components/TextInput.jsx'
import Textarea from '../components/Textarea.jsx'
import styles from './Example.module.css'

function Example() {
  const [name, setName, clearName] = useOverride('user.name')
  const [username, setUsername, clearUsername] = useOverride('user.username')
  const [bio, , clearBio] = useOverride('user.profile.bio')
  const [location, , clearLocation] = useOverride('user.profile.location')
  const { sceneName, switchScene } = useScene()

  const nextScene = (sceneName === 'default') ? 'other-scene' : 'default'

  const resetUser = () => {
    clearName()
    clearUsername()
    clearBio()
    clearLocation()
  }

  return (
    <div className={styles.containerOuter}>
      <ColorModeSwitcher />
      <div className={styles.container}>
        <h2 className={styles.title}>useOverride Demo</h2>
        <p>Add <code>#user.name=Alice</code> to the URL hash to override any value.</p>

        <section>
          <Text as="h3" fontWeight="bold">Scene</Text>
          <pre className={styles.codeBlock}>current: {sceneName}</pre>
          
          <Button size="small" onClick={() => switchScene(nextScene)}>
            Switch to &quot;{nextScene}&quot;
          </Button>
        </section>

        <section>
          <Text as="h3" fontWeight="bold">User</Text>
          <pre className={styles.codeBlock}>
            {name} ({username})
          </pre>
          <pre className={styles.codeBlock}>
            {bio} · {location}
          </pre>

          <Text as="h4" fontWeight="semibold" fontSize={1}>Switch User</Text>
          <ButtonGroup>
            <Button size="small" onClick={() => setName('Alice Chen')}>Update name</Button>
            <Button size="small" onClick={() => setUsername('alice123')}>Update username</Button>
          </ButtonGroup>
          <Button size="small" variant="danger" onClick={resetUser} style={{ marginLeft: '8px' }}>
            Reset
          </Button>
        </section>

        <section>
          <Text as="h3" fontWeight="bold">Edit User</Text>
          <StoryboardForm data="user" className={styles.form}>
            <FormControl>
              <FormControl.Label>Name</FormControl.Label>
              <TextInput name="name" placeholder="Name" size="small" />
            </FormControl>
            <FormControl>
              <FormControl.Label>Username</FormControl.Label>
              <TextInput name="username" placeholder="Username" size="small" />
            </FormControl>
            <FormControl>
              <FormControl.Label>Bio</FormControl.Label>
              <Textarea name="profile.bio" placeholder="Bio" />
            </FormControl>
            <FormControl>
              <FormControl.Label>Location</FormControl.Label>
              <TextInput name="profile.location" placeholder="Location" size="small" />
            </FormControl>
            <Button type="submit" size="small">Save</Button>
          </StoryboardForm>
        </section>
      </div>
    </div>
  )
}

export default Example
