'use client'
import { useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from './store'
import { initializeState } from './features/tree/treeSlice'

export default function StoreProvider({
  tree,
  children
}: {
  tree: any,  
  children: React.ReactNode
}) {
  const storeRef = useRef<AppStore>()
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore()
    storeRef.current.dispatch(initializeState(tree))
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}