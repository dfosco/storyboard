// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
    | `///src/prototypes`
    | `///src/prototypes/Example`
    | `///src/prototypes/Example/Forms`
    | `///src/prototypes/Example/posts`
    | `///src/prototypes/Example/posts/:id`
    | `///src/prototypes/Signup`
    | `///src/prototypes/Signup/Dashboard`

export type Params = {
    '///src/prototypes/Example/posts/:id': { id: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<
    Path,
    Params,
    ModalPath
>()
export const { redirect } = utils<Path, Params>()
