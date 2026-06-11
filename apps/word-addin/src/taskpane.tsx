import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { login, generateText, correctText, adaptStyle } from './api';

declare const Office: typeof import('@microsoft/office-js');

type Tab = 'draft' | 'correct' | 'style';
type Status = 'idle' | 'loading' | 'done' | 'error';

interface AppState {
  token: string | null;
  email: string;
  password: string;
  loginError: string;
  tab: Tab;
  instruction: string;
  docType: string;
  styleRef: string;
  result: string;
  status: Status;
  errorMsg: string;
}

function App() {
  const [state, setState] = useState<AppState>({
    token: null,
    email: '',
    password: '',
    loginError: '',
    tab: 'draft',
    instruction: '',
    docType: 'acte_juridique',
    styleRef: 'formel et concis',
    result: '',
    status: 'idle',
    errorMsg: '',
  });

  const set = (patch: Partial<AppState>) => setState(prev => ({ ...prev, ...patch }));

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    set({ loginError: '' });
    try {
      const token = await login(state.email, state.password);
      set({ token });
    } catch (err: any) {
      set({ loginError: err?.message ?? 'Connexion échouée' });
    }
  }

  async function getSelectionText(): Promise<string> {
    return new Promise((resolve) => {
      Office.context.document.getSelectedDataAsync(
        Office.CoercionType.Text,
        (result) => resolve(result.status === Office.AsyncResultStatus.Succeeded ? (result.value as string) : ''),
      );
    });
  }

  async function insertText(text: string) {
    return new Promise<void>((resolve) => {
      Office.context.document.setSelectedDataAsync(
        text,
        { coercionType: Office.CoercionType.Text },
        () => resolve(),
      );
    });
  }

  async function handleAction() {
    if (!state.token) return;
    set({ status: 'loading', result: '', errorMsg: '' });
    try {
      let text = '';
      if (state.tab === 'draft') {
        text = await generateText(state.token, state.instruction, state.docType);
      } else if (state.tab === 'correct') {
        const selected = await getSelectionText();
        if (!selected.trim()) throw new Error('Sélectionnez du texte dans Word avant de corriger.');
        text = await correctText(state.token, selected);
      } else if (state.tab === 'style') {
        const selected = await getSelectionText();
        if (!selected.trim()) throw new Error('Sélectionnez du texte dans Word avant d\'adapter le style.');
        text = await adaptStyle(state.token, selected, state.styleRef);
      }
      set({ result: text, status: 'done' });
    } catch (err: any) {
      set({ status: 'error', errorMsg: err?.message ?? 'Erreur inconnue' });
    }
  }

  async function applyResult() {
    await insertText(state.result);
    set({ result: '', status: 'idle' });
  }

  const s: React.CSSProperties = {};

  if (!state.token) {
    return (
      <div style={{ padding: 20, maxWidth: 340 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, background: '#1a2c5b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>EL</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2c5b' }}>EasyLaw IA Juridique</div>
            <div style={{ fontSize: 11, color: '#888' }}>Connexion à votre compte</div>
          </div>
        </div>
        <form onSubmit={handleLogin}>
          <label style={labelStyle}>Email</label>
          <input value={state.email} onChange={e => set({ email: e.target.value })} type="email" required style={inputStyle} placeholder="votre@email.com" />
          <label style={labelStyle}>Mot de passe</label>
          <input value={state.password} onChange={e => set({ password: e.target.value })} type="password" required style={inputStyle} />
          {state.loginError && <p style={{ fontSize: 11, color: '#d32f2f', marginBottom: 8 }}>{state.loginError}</p>}
          <button type="submit" style={btnPrimary}>Se connecter</button>
        </form>
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'draft', label: 'Rédiger' },
    { id: 'correct', label: 'Corriger' },
    { id: 'style', label: 'Style' },
  ];

  return (
    <div style={{ padding: 16, maxWidth: 340 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2c5b' }}>EasyLaw IA</div>
        <button onClick={() => set({ token: null })} style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>Déconnexion</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => set({ tab: t.id, result: '', status: 'idle' })} style={{ flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', borderBottom: state.tab === t.id ? '2px solid #1a2c5b' : '2px solid transparent', color: state.tab === t.id ? '#1a2c5b' : '#888', cursor: 'pointer' }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      {state.tab === 'draft' && (
        <div>
          <label style={labelStyle}>Type de document</label>
          <select value={state.docType} onChange={e => set({ docType: e.target.value })} style={inputStyle}>
            <option value="acte_juridique">Acte juridique</option>
            <option value="lettre_mise_en_demeure">Mise en demeure</option>
            <option value="contrat">Contrat</option>
            <option value="conclusions">Conclusions</option>
            <option value="requete">Requête</option>
          </select>
          <label style={labelStyle}>Instruction</label>
          <textarea value={state.instruction} onChange={e => set({ instruction: e.target.value })} rows={5} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Ex: Rédigez une clause de non-concurrence de 12 mois valable en droit portugais..." />
          <button onClick={handleAction} disabled={state.status === 'loading' || !state.instruction.trim()} style={{ ...btnPrimary, opacity: state.status === 'loading' ? 0.6 : 1 }}>
            {state.status === 'loading' ? 'Génération...' : 'Générer'}
          </button>
        </div>
      )}

      {state.tab === 'correct' && (
        <div>
          <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>Sélectionnez le texte à corriger dans Word, puis cliquez sur Corriger.</p>
          <button onClick={handleAction} disabled={state.status === 'loading'} style={{ ...btnPrimary, opacity: state.status === 'loading' ? 0.6 : 1 }}>
            {state.status === 'loading' ? 'Correction...' : 'Corriger la sélection'}
          </button>
        </div>
      )}

      {state.tab === 'style' && (
        <div>
          <label style={labelStyle}>Style de référence</label>
          <input value={state.styleRef} onChange={e => set({ styleRef: e.target.value })} style={inputStyle} placeholder="Ex: formel et concis, style notarial..." />
          <p style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>Sélectionnez le texte à adapter dans Word.</p>
          <button onClick={handleAction} disabled={state.status === 'loading'} style={{ ...btnPrimary, opacity: state.status === 'loading' ? 0.6 : 1 }}>
            {state.status === 'loading' ? 'Adaptation...' : 'Adapter le style'}
          </button>
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <div style={{ marginTop: 12, padding: 10, background: '#fff3f3', borderRadius: 6, fontSize: 11, color: '#d32f2f' }}>
          {state.errorMsg}
        </div>
      )}

      {/* Result */}
      {state.status === 'done' && state.result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#1a2c5b', marginBottom: 6 }}>Résultat généré</div>
          <div style={{ maxHeight: 200, overflowY: 'auto', padding: 10, background: '#f5f7fa', borderRadius: 6, fontSize: 11, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap', border: '1px solid #e0e0e0' }}>
            {state.result}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={applyResult} style={btnPrimary}>Insérer dans Word</button>
            <button onClick={() => set({ result: '', status: 'idle' })} style={btnSecondary}>Ignorer</button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, marginTop: 10 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, background: '#fff', boxSizing: 'border-box', marginBottom: 4 };
const btnPrimary: React.CSSProperties = { display: 'block', width: '100%', padding: '10px', marginTop: 12, background: '#1a2c5b', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { ...btnPrimary, background: '#f0f0f0', color: '#555', marginTop: 0, flex: 1 };

// Entry point — wait for Office to be ready
Office.onReady(() => {
  const container = document.getElementById('root');
  if (container) {
    createRoot(container).render(<App />);
  }
});
