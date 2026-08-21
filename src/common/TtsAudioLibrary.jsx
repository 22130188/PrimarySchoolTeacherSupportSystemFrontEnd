import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Volume2 } from 'lucide-react';
import TTSService from '../services/TTSService';
import { useAuthStore } from '../stores/authStore';

const audioName = (audio) => audio.audioName || audio.fileName || audio.originalName || 'Audio TTS';

export default function TtsAudioLibrary({ onSelectAudio }) {
  const user = useAuthStore((state) => state.user);
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAudios = useCallback(async () => {
    if (!user?.id) return setAudios([]);
    setLoading(true);
    try {
      const result = await TTSService.getSavedAudios();
      setAudios(result.filter((audio) => audio?.audioUrl));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadAudios(); }, [loadAudios]);
  return (
    <div>
      <button type="button" onClick={loadAudios}>Tai lai</button>
      {loading && <p>Dang tai audio...</p>}
      {!loading && audios.length === 0 && <p>Chua co audio TTS trong thu vien.</p>}
      {!loading && audios.length > 0 && <div className={'space-y-3 max-h-[430px] overflow-y-auto pr-1'}>{audios.map((audio) => <article key={audio.id || audio.audioUrl} className={'rounded-xl border border-gray-200 bg-white p-3 shadow-sm'}><div className={'flex items-center gap-2'}><span className={'rounded-lg bg-indigo-50 p-2 text-indigo-600'}><Volume2 size={16} /></span><p className={'min-w-0 flex-1 truncate text-sm font-semibold text-gray-800'}>{audioName(audio)}</p><button type="button" onClick={() => onSelectAudio?.({ url: audio.audioUrl, name: audioName(audio) })} className={'rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700'}>Chen</button></div><audio controls preload="metadata" src={audio.audioUrl} className={'mt-3 h-8 w-full'} /></article>)}</div>}
    </div>
  );
}
