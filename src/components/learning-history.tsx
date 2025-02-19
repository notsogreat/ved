import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface LearningHistoryProps {
  isOpen: boolean
  onClose: () => void
}

export function LearningHistory({ isOpen, onClose }: LearningHistoryProps) {
  return (
    <div
      className={`fixed inset-y-0 right-0 w-80 bg-background border-l transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Learning History</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Overall Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "45%" }}></div>
          </div>
          <p className="text-sm mt-1">45% Complete</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Recent Topics</h3>
          <ul className="space-y-2">
            <li>Variables and Data Types</li>
            <li>Control Structures</li>
            <li>Functions</li>
            <li>Pointers</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

