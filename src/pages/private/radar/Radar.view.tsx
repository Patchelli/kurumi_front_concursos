import { Link } from 'react-router-dom';
import { UserMenu } from '@components/layout/UserMenu';
import { logoutMethod } from '@utils/logoutMethod';
import { regions } from './Radar.tokens';
import type { RadarViewProps } from './Radar.type';
import '../../../styles/radar.css';

export function RadarView({ form, setForm, saved, result, loading, error, notice, visible, firstName, dirty, onSearch, onShowMore }: RadarViewProps) {
  const states = form.region ? regions[form.region]?.states ?? [] : Object.values(regions).flatMap(r => r.states).sort();
  return <div className="journey-hub">
    <header className="hub-topbar">
      <Link className="hub-brand" to="/inicio" aria-label="Kurumí"><span className="hub-logo">K</span><span>Kurumí</span></Link>
      <nav className="hub-nav" aria-label="Navegação principal"><Link to="/inicio">Jornadas</Link><Link to="/calendario">Calendário</Link><Link to="/radar" className="active" aria-current="page">Radar</Link></nav>
      <UserMenu firstName={firstName} onLogout={logoutMethod} />
    </header>
    <main className="radar-page">
      <header className="radar-heading"><h1>Radar de concursos</h1><p>Encontre sua próxima oportunidade, com o que faz sentido para você.</p></header>
      <div className="radar-layout">
        <form className="radar-preferences" onSubmit={event => { event.preventDefault(); void onSearch(true); }}>
          <h2>Seus interesses</h2><p>Salve uma vez. Consulte sempre que quiser.</p>
          <fieldset disabled={loading || !saved}>
            <label>Região<select value={form.region} onChange={e => setForm({ ...form, region: e.target.value, state: '' })}><option value="">Todo o Brasil</option>{Object.entries(regions).map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}</select></label>
            <label>Estado<select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}><option value="">Todos da região</option>{states.map(state => <option key={state}>{state}</option>)}</select></label>
            <label>Escolaridade de interesse<select value={form.education} onChange={e => setForm({ ...form, education: e.target.value })}><option value="">Todas as escolaridades</option><option value="fundamental">Ensino fundamental</option><option value="medio">Ensino médio</option><option value="tecnico">Ensino técnico</option><option value="superior">Ensino superior</option></select></label>
            <label>Cargo<input value={form.role} maxLength={100} placeholder="Ex.: analista, enfermeiro" onChange={e => setForm({ ...form, role: e.target.value })} /><small>Opcional. Informe um cargo ou parte do nome.</small></label>
            <label className="radar-checkbox"><input type="checkbox" checked={form.includeNational} onChange={e => setForm({ ...form, includeNational: e.target.checked })} />Incluir concursos nacionais</label>
            <button className="button primary" type="submit">Salvar e buscar</button>
          </fieldset>
          {dirty && <p className="radar-pending">Você tem alterações para salvar.</p>}
          {notice && <p className="radar-notice" role="status">{notice}</p>}
        </form>
        <section className="radar-results" aria-busy={loading} aria-label="Concursos encontrados">
          <header className="radar-results-heading"><div><h2>{result ? `${result.contests.length} oportunidades` : 'Oportunidades para você'}</h2><p>Inscrições abertas · encerram primeiro</p></div><button type="button" className="button secondary" disabled={loading || dirty} onClick={() => void onSearch(false)}>Atualizar</button></header>
          {saved && <div className="radar-summary"><span>{saved.state || regions[saved.region]?.label || 'Todo o Brasil'}</span><span>{saved.education ? ({ superior: 'Superior', medio: 'Médio', tecnico: 'Técnico', fundamental: 'Fundamental' }[saved.education]) : 'Todas as escolaridades'}</span>{saved.role && <span>{saved.role}</span>}{saved.includeNational && <span>Inclui nacionais</span>}</div>}
          {loading && <div className="radar-state" role="status">Buscando oportunidades no PCI Concursos…</div>}
          {error && <div className="radar-state" role="alert"><h3>Não conseguimos carregar agora</h3><p>{error}</p><button className="button secondary" onClick={() => void onSearch(false)}>Tentar novamente</button></div>}
          {!loading && result?.contests.length === 0 && <div className="radar-state"><h3>Nenhum concurso com esses interesses</h3><p>Experimente ampliar a região, mudar a escolaridade ou buscar parte do nome do cargo.</p></div>}
          {!loading && result && result.contests.slice(0, visible).map(contest => <article className="radar-contest" key={contest.id}>
            <div className="radar-contest-meta"><span>{contest.location || 'Local não informado'}</span><span className={contest.daysRemaining !== null && contest.daysRemaining <= 7 ? 'radar-urgent' : ''}>{contest.daysRemaining === null ? 'Prazo não informado' : contest.daysRemaining === 0 ? 'Encerra hoje' : `Encerra em ${contest.daysRemaining} ${contest.daysRemaining === 1 ? 'dia' : 'dias'}`}</span></div>
            <h3>{contest.title}</h3><p className="radar-roles">{contest.roles || 'Consulte os cargos no edital'}</p>
            <div className="radar-contest-details"><strong>{contest.vacanciesSalary || 'Vagas e salário não informados'}</strong><span>{contest.education || 'Escolaridade não informada'}</span></div>
            <footer><span>{contest.deadline ? `Inscrições até ${contest.deadline.split('-').reverse().join('/')}` : 'Confira o prazo na publicação'} </span>{contest.url && <a href={contest.url} target="_blank" rel="noopener noreferrer">Ver no PCI Concursos ↗</a>}</footer>
          </article>)}
          {!loading && result && visible < result.contests.length && <button className="button secondary radar-more" onClick={() => onShowMore()}>Mostrar mais concursos</button>}
          <footer className="radar-source">Fonte: <a href="https://www.pciconcursos.com.br/mcp-e-gpt" target="_blank" rel="noopener noreferrer">PCI Concursos</a>{result && <> · Consultado em {new Date(result.updatedAt).toLocaleString('pt-BR')}</>}. As consultas podem ser reutilizadas por até 10 minutos. A escolaridade é informada por concurso; confirme os requisitos do cargo e os prazos no edital.</footer>
        </section>
      </div>
    </main>
  </div>;
}
