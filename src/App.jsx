import { useState } from 'react'
import './App.css'
import SensorData from './SensorData'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <SensorData/>
    </>
  )
}

export default App
