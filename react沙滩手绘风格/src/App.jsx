import React from 'react'
import OriginalBeach from './components/OriginalBeach'
import SwimmerBeach from './components/SwimmerBeach'
import LargeBoatBeach from './components/LargeBoatBeach'
import CountrysideEvening from './components/CountrysideEvening'

const App = () => {
  return (
    <div className="scenes">
      <OriginalBeach />
      <SwimmerBeach />
      <CountrysideEvening />
      <LargeBoatBeach />
    </div>
  )
}

export default App
