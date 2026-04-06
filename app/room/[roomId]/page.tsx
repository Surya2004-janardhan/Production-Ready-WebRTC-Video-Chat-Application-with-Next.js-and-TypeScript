import type { Metadata } from 'next';
import RoomPage from '@/components/RoomPage';

interface Props {
  params: { roomId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Room ${params.roomId.slice(0, 8)}… | WebRTC Video Chat`,
    description: 'Live peer-to-peer video call room',
  };
}

export default function Page({ params }: Props) {
  return <RoomPage roomId={params.roomId} />;
}
