import React, { useEffect, useState } from 'react';
import { KEY_ACTIONS } from '../../modules/base-operations/services/keymap';

/**
 * Hidden page (/dev/keys) for WICEN2 parity Phase 0: press each Alt key on a
 * real device and note whether the page got it and whether the browser still
 * acted (menu opened, address bar focused). Not linked from the app.
 */
const KeyCheckView = () => {
  const [log, setLog] = useState([]);
  const [seen, setSeen] = useState({}); // code → { alt, altShift }
  useEffect(() => {
    const onKey = (e) => {
      const hit = e.altKey && KEY_ACTIONS.some(a => a.code === e.code);
      if (hit) e.preventDefault();
      setLog(l => [{ code: e.code, key: e.key, alt: e.altKey, shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey, stopped: e.defaultPrevented }, ...l].slice(0, 30));
      if (hit) setSeen(s => ({ ...s, [e.code]: { ...s[e.code], [e.shiftKey ? 'altShift' : 'alt']: true } }));
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);
  const codes = [...new Set(KEY_ACTIONS.map(a => a.code))];
  return (
    <div className="p-4 max-w-3xl mx-auto text-sm" data-testid="key-check">
      <h1 className="font-display font-bold text-xl text-vk-navy mb-1">Key capture check</h1>
      <p className="mb-3">Press each Alt key, then Alt+Shift+key. A tick means the page received it. Note separately if the browser still did something (menu, address bar).</p>
      <p className="mb-3 text-vk-muted">{navigator.userAgent}{window.matchMedia?.('(display-mode: standalone)').matches ? ' · installed app' : ' · browser tab'}</p>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-4">
        {codes.map(c => (
          <div key={c} className={`rounded-btn border px-2 py-1 ${seen[c]?.alt ? 'border-vk-navy bg-vk-band' : 'border-vk-border'}`}>
            <div className="font-bold">Alt+{c.replace('Key', '')}</div>
            <div className="text-xs">{seen[c]?.alt ? '✓' : '–'} alt · {seen[c]?.altShift ? '✓' : '–'} shift</div>
          </div>
        ))}
      </div>
      <table className="w-full text-xs">
        <thead><tr className="text-left"><th>code</th><th>key</th><th>mods</th><th>preventDefault</th></tr></thead>
        <tbody>
          {log.map((r, i) => (
            <tr key={i} className="border-t border-vk-border">
              <td>{r.code}</td><td>{r.key}</td>
              <td>{[r.alt && 'Alt', r.shift && 'Shift', r.ctrl && 'Ctrl', r.meta && 'Meta'].filter(Boolean).join('+')}</td>
              <td>{r.stopped ? 'yes' : 'no'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default KeyCheckView;
