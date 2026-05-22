import ExplorerGraph from '../components/ExplorerGraph'

function Explorer() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#F3F0E8]">AI Regulation Explorer</h1>
        <p className="mt-1 text-sm text-[#8E96A8]">
          Navigate the EU AI Act — click any node to explore risk classifications, obligations, and enforcement timelines.
        </p>
      </div>
      <ExplorerGraph />
    </div>
  )
}

export default Explorer
