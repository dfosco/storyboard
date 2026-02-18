// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/Dashboard`
  | `/Signup`
  | `/primer-issues`
  | `/primer-issues/:id`
  | `/reshaped-issues`
  | `/reshaped-issues/:id`
  | `/viewfinder`

export type Params = {
  '/primer-issues/:id': { id: string }
  '/reshaped-issues/:id': { id: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
