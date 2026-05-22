import Explorer from './pages/Explorer'

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-8 py-4 flex items-center gap-3">
        <span className="text-lg font-semibold tracking-tight text-white">ThemisOS</span>
        <span className="text-xs text-gray-500 mt-0.5">AI Governance Intelligence</span>
      </header>
      <main className="p-8">
        <Explorer />
      </main>
    </div>
  )
}

export default App