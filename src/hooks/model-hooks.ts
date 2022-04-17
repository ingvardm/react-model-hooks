import { Context, useContext } from 'react'

import { Model } from '../Model'

export function useModelCtx<M extends Model<M['state'], M['events']>>(
	ctx: Context<M>,
) {
	return useContext(ctx)
}
