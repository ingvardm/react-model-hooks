import React, {
	createContext,
	FC,
	ProviderProps,
	useContext,
	useEffect,
	useMemo
} from 'react'

type SharedEvent = (...args: unknown[]) => unknown

function useSharedEvent(cb: SharedEvent, deps: unknown[]){
	return () => {}
}

const ChildFC: FC = () => {
	const emitClickEvent = useSharedEvent('myButtonClick',)

	return <div onClick={emitClickEvent}/>
}

const ParentFC: FC = () => {


	return <ChildFC/>
}

const App = () => {
	return 
}

