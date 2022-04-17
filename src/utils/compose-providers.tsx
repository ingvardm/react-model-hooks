import React, { FC } from 'react'

export function composeProviders(providers: FC[]): FC{
	return providers.reduce(
		(Parent: FC, Child: FC) => ({ children }): JSX.Element => {
			return <Parent>
				<Child>
					{ children }
				</Child>
			</Parent>
		},
		({ children }) => <>{ children }</>
	)
}
