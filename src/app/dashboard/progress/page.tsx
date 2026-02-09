import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { BookOpen } from 'lucide-react';

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress Log</h1>
        <p className="text-gray-500">Journal your wins, learnings, and reflections</p>
      </div>

      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Coming Soon</h3>
              <p className="text-gray-500 mt-1">
                Progress logging with tags (#win, #learning, #blocker),
                timeline view, and weekly summaries will be available soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
