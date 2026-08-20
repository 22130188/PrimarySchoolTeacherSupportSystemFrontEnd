import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import TTSService from '../services/TTSService';
import { useAuthStore } from '../stores/authStore';

export default function TtsAudioLibrary({ onSelectAudio }) {
  const user = useAuthStore((state) => state.user);
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAudios = useCallback(async () => {
    if (!user?.id) return setAudios([]);
    setLoading(true);
    try {
      const result = await TTSService.getSavedAudios(user.id);
      setAudios(result.filter((audio) => audio?.audioUrl));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadAudios(); }, [loadAudios]);
  const handleSelectAudio = (event) => {
    if (event.target.value === '__none__') return;
    onSelectAudio?.({ url: event.target.value, name: event.target.selectedOptions[0]?.text || 'Audio TTS' });
    event.target.value = '__none__';
  };

  return (
    <div>
      <button type="button" onClick={loadAudios}>Tai lai</button>
      {loading && <p>Dang tai audio...</p>}
      {!loading && audios.length === 0 && <p>Chua co audio TTS trong thu vien.</p>}
      {!loading && audios.length > 0 && <select className={'w-full rounded border border-gray-300 p-2 text-sm'} onChange={handleSelectAudio} defaultValue={'__none__'}><option value={'__none__'}>Chon audio de chen</option>{audios.map((audio) => <option key={audio.id || audio.audioUrl} value={audio.audioUrl}>{audio.audioName || audio.fileName || 'Audio TTS'}</option>)}</select>}
    </div>
  );
}
