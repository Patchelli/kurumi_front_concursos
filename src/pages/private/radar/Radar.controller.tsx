import { RadarView } from './Radar.view';
import { useEffect, useRef, useState } from 'react';
import { radarService, type RadarPreferences, type RadarResult } from '@business/service/Radar.service';

const defaults: RadarPreferences = { region: '', state: '', education: '', role: '', includeNational: true };

export default function RadarController() {
  const [form, setForm] = useState(defaults);
  const [saved, setSaved] = useState<RadarPreferences | null>(null);
  const [result, setResult] = useState<RadarResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [visible, setVisible] = useState(20);
  const mounted = useRef(false);
  const [firstName] = useState(() => { try { return JSON.parse(localStorage.getItem('kurumi_concursos_user') ?? '{}').name?.split(' ')[0] || 'estudante'; } catch { return 'estudante'; } });

  useEffect(() => {
    mounted.current = true;
    let active = true;
    async function load() {
      try {
        const preferences = await radarService.preferences();
        if (!active) return;
        setForm(preferences); setSaved(preferences);
        const response = await radarService.contests();
        if (active) setResult(response);
      } catch { if (active) setError('Não foi possível carregar o Radar. Tente novamente.'); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; mounted.current = false; };
  }, []);

  async function search(save: boolean) {
    setLoading(true); setError(''); setNotice(''); setResult(null); setVisible(20);
    try {
      if (save) {
        const preferences = { ...form, role: form.role.trim() };
        const success = await radarService.save(preferences);
        if (!success) throw new Error('Save failed');
        if (!mounted.current) return;
        setSaved(preferences); setForm(preferences); setNotice('Preferências salvas na sua conta.');
      } else if (!saved) {
        const preferences = await radarService.preferences();
        if (!mounted.current) return;
        setSaved(preferences); setForm(preferences);
      }
      const response = await radarService.contests();
      if (mounted.current) setResult(response);
    } catch { if (mounted.current) setError('Não foi possível concluir a consulta. Tente novamente em instantes.'); }
    finally { if (mounted.current) setLoading(false); }
  }

  const dirty = saved !== null && JSON.stringify(form) !== JSON.stringify(saved);
  return <RadarView form={form} setForm={setForm} saved={saved} result={result} loading={loading} error={error} notice={notice} visible={visible} firstName={firstName} dirty={dirty} onSearch={search} onShowMore={() => setVisible(v => v + 20)} />;
}
