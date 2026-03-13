// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `///src/prototypes`
  | `///src/prototypes/Test/folder/Example`
  | `///src/prototypes/Test/folder/Example/Forms`
  | `///src/prototypes/Test/folder/Example/posts`
  | `///src/prototypes/Test/folder/Example/posts/:id`
  | `///src/prototypes/Test/folder/Signup`
  | `///src/prototypes/Test/folder/Signup/Dashboard`

export type Params = {
  '///src/prototypes/Test/folder/Example/posts/:id': { id: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
