import SingleAppLayout from '@/layout/single-app-layout';
import MultiAppLayout from '@/layout/multi-app-layout';
import { useDifyChat } from 'packages/core/dist';

export default function ChatPage() {
  const { mode } = useDifyChat();

  if (mode === 'singleApp') {
    return <SingleAppLayout />;
  }

  return <MultiAppLayout />;
}
