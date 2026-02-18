## Updating Storyboard Packages

This project depends on four `@dfosco/storyboard-*` packages that should always be updated together and kept on the same version:

- `@dfosco/storyboard-core`
- `@dfosco/storyboard-react`
- `@dfosco/storyboard-react-primer`
- `@dfosco/storyboard-react-reshaped`

### How to update

Run the update script:

```bash
# Update all storyboard packages to the latest version
npm run update:storyboard

# Update to a specific version
npm run update:storyboard -- 1.8.0
```

### Rules

- **Never update these packages individually.** Always update all four together.