# Prototypes Restructure 

Prerequisite work that unlocks Workshop features and Modes. Establishes the canonical hierarchy: **Storyboard → Prototype → Flow**.

### Rename pages → prototypes

- [ ] Configure generouted to use `src/prototypes/` instead of `src/pages/`
- [ ] Move all files from `src/pages/` to `src/prototypes/`
- [ ] Update Viewfinder glob and path-stripping logic (`/src/pages/` → `/src/prototypes/`)
- [ ] Update `vite.config.js` warmup glob
- [ ] Update Workshop `createPage` server to write to `src/prototypes/`
- [ ] Add optional `name.prototype.json` metadata file (name, description, author, icon)

### Rename scenes → flows

- [ ] Change data plugin suffixes: `.scene.json` → `.flow.json` (glob, regex, index keys)
- [ ] Rename loader functions: `loadScene` → `loadFlow`, `sceneExists` → `flowExists`
- [ ] Rename hooks: `useSceneData` → `useFlowData`, `useScene` → `useFlow`
- [ ] Rename context: `sceneName` → `flowName`, `StoryboardProvider` scene props
- [ ] Rename existing data files (`default.scene.json` → `default.flow.json`, etc.)
- [ ] Keep supporting `name.scene.json` indefinitely as if it was `name.flow.json`
- [ ] Update Workshop `createPage` to generate `.flow.json` instead of `.scene.json`

### Viewfinder iteration

- [ ] Viewfinder should list prototypes instead of scenes/flows
- [ ] Prototypes can be expanded to show all Flows they possess -- .flow.json files listed inside of them
- [ ] Prototypes can take additional metadata shown next to the authors on `name.prototype.json`: team, tags
- [ ] `name.prototype.json` gets author as the git user who first created the file if the field is missing/empty 