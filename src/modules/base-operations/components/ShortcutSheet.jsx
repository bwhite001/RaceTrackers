import React from 'react';
import { createPortal } from 'react-dom';
import { BottomSheet } from '../../../design-system/components/VK';
import { Button } from '../../../design-system/components';
import { KEY_ACTIONS, WHERE_DID_IT_GO } from '../services/keymap';

const ENTRY = 'CheckPt ⏎  Time ⏎  Number ⏎  Number ⏎ …  Alt+U';

const KeyTable = ({ dense = false }) => (
  <table className={`w-full border-collapse ${dense ? 'text-[11px]' : 'text-[13px]'}`}>
    <thead>
      <tr className="text-left text-vk-muted uppercase tracking-[0.8px] text-[11px]">
        <th scope="col" className="py-1 pr-2">Key</th><th scope="col" className="py-1 pr-2">WICEN2</th><th scope="col" className="py-1">RaceTracker</th>
      </tr>
    </thead>
    <tbody>
      {KEY_ACTIONS.map(a => (
        <tr key={a.code} className="border-t border-vk-border">
          <td className="py-1 pr-2 font-bold whitespace-nowrap">Alt+{a.letter}</td>
          <td className="py-1 pr-2">{a.wicen2}</td>
          <td className={`py-1 ${a.message ? 'text-vk-muted' : ''}`}>{a.message ?? a.here}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const WhereTable = () => (
  <table className="w-full border-collapse text-[13px]">
    <tbody>
      {WHERE_DID_IT_GO.map(w => (
        <tr key={w.wicen2} className="border-t border-vk-border">
          <td className="py-1 pr-2 font-bold whitespace-nowrap">{w.wicen2}</td><td className="py-1">{w.here}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

/** One A4 page for the base table. Hidden on screen; printed alone (body.print-keycard). */
const KeyboardCard = () => createPortal(
  <div id="keycard-print" className="hidden print:block p-6 text-vk-ink bg-white">
    <div className="flex items-center gap-3 border-b-4 border-vk-gold pb-2 mb-3">
      <img src="/pwa-512x512.png" alt="" className="w-12 h-12" />
      <div>
        <div className="font-display font-extrabold text-xl text-vk-navy">RaceTracker Pro · Base keyboard card</div>
        <div className="text-xs">WICEN2 keys work the same. Alt+Shift+letter also works where the browser keeps Alt+letter.</div>
      </div>
    </div>
    <div className="font-bold text-sm mb-1">Entering a call</div>
    <div className="font-mono text-sm mb-1">{ENTRY}</div>
    <div className="text-xs mb-3">Enter on an empty Time box keeps the block shown. Shift+Tab goes back to Time, twice to CheckPt. Esc clears the typed number.</div>
    <KeyTable dense />
  </div>,
  document.body,
);

const printCard = () => {
  document.body.classList.add('print-keycard');
  const done = () => { document.body.classList.remove('print-keycard'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  window.print();
};

/** Alt+H / ? — every WICEN2 key and where each WICEN2 job went. Generated from the keymap table. */
const ShortcutSheet = ({ open, onClose }) => (
  <>
    {open && <KeyboardCard />}
    <BottomSheet open={open} onClose={onClose} labelledBy="keys-hd">
      <h2 id="keys-hd" className="font-display font-bold text-xl text-vk-navy dark:text-white">Keyboard shortcuts</h2>
      <div className="text-[13px]">
        <div className="font-bold">Entering a call, as in WICEN2</div>
        <div className="font-mono">{ENTRY}</div>
        <div className="text-vk-muted">Hold Alt to see each button&apos;s key. Alt+Shift+letter works too.</div>
      </div>
      <KeyTable />
      <h3 className="font-display font-bold text-base text-vk-navy dark:text-white">Where did it go?</h3>
      <WhereTable />
      <div className="flex gap-2">
        <Button variant="blueOutline" size="primary" className="flex-1" onClick={printCard}>Print keyboard card</Button>
        <Button variant="ghost" size="primary" className="flex-1" onClick={onClose}>Close</Button>
      </div>
    </BottomSheet>
  </>
);

export default ShortcutSheet;
