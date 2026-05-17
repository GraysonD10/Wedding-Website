// RSVP form — 4-card stepper + submit state machine
// Loaded by index.html after React + Babel.

const { useState, useEffect, useRef } = React;

// ─── tiny botanical SVGs ──────────────────────────────────────────────────
const Sprig = ({ color = 'currentColor', w = 80 }) => (
  <svg viewBox="0 0 120 30" width={w} height={w * 30 / 120} aria-hidden="true"
       style={{ display: 'block' }}>
    <g fill="none" stroke={color} strokeWidth="0.7" strokeLinecap="round">
      <path d="M10 18 Q 35 6, 60 16 Q 85 26, 110 14" />
      <path d="M28 14 Q 30 8, 36 10" /><path d="M28 14 Q 26 18, 30 20" />
      <path d="M48 12 Q 50 6, 56 8" /><path d="M48 12 Q 46 16, 50 18" />
      <path d="M70 18 Q 72 12, 78 14" /><path d="M70 18 Q 68 22, 72 24" />
      <path d="M90 16 Q 92 10, 98 12" /><path d="M90 16 Q 88 20, 92 22" />
      <ellipse cx="34" cy="10" rx="3" ry="1.4" transform="rotate(-25 34 10)" />
      <ellipse cx="30" cy="19" rx="3" ry="1.4" transform="rotate(25 30 19)" />
      <ellipse cx="54" cy="8" rx="3" ry="1.4" transform="rotate(-25 54 8)" />
      <ellipse cx="50" cy="17" rx="3" ry="1.4" transform="rotate(25 50 17)" />
      <ellipse cx="76" cy="14" rx="3" ry="1.4" transform="rotate(-25 76 14)" />
      <ellipse cx="72" cy="23" rx="3" ry="1.4" transform="rotate(25 72 23)" />
      <ellipse cx="96" cy="12" rx="3" ry="1.4" transform="rotate(-25 96 12)" />
      <ellipse cx="92" cy="21" rx="3" ry="1.4" transform="rotate(25 92 21)" />
    </g>
  </svg>
);

const FloralBouquet = ({ color = 'currentColor', w = 220 }) => (
  <svg viewBox="0 0 240 150" width={w} height={w * 150 / 240} aria-hidden="true"
       style={{ display: 'block' }}>
    <g fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round">
      <path d="M120 138 Q 116 108, 118 82 Q 120 58, 120 34" />
      <path d="M120 138 Q 96 112, 78 86 Q 62 62, 50 38" />
      <path d="M120 138 Q 144 112, 162 86 Q 178 62, 190 38" />
      <path d="M116 120 Q 92 111, 70 114 Q 48 118, 28 105" />
      <path d="M124 120 Q 148 111, 170 114 Q 192 118, 212 105" />
      <path d="M105 96 Q 86 86, 68 82" />
      <path d="M135 96 Q 154 86, 172 82" />

      {[120, 50, 190].map((x, i) => {
        const y = i === 0 ? 34 : 38;
        return (
          <g key={`flower-${i}`}>
            <circle cx={x} cy={y} r="5" />
            <ellipse cx={x} cy={y - 11} rx="5" ry="10" />
            <ellipse cx={x + 10} cy={y - 3} rx="5" ry="10" transform={`rotate(64 ${x + 10} ${y - 3})`} />
            <ellipse cx={x + 6} cy={y + 9} rx="5" ry="10" transform={`rotate(136 ${x + 6} ${y + 9})`} />
            <ellipse cx={x - 6} cy={y + 9} rx="5" ry="10" transform={`rotate(44 ${x - 6} ${y + 9})`} />
            <ellipse cx={x - 10} cy={y - 3} rx="5" ry="10" transform={`rotate(-64 ${x - 10} ${y - 3})`} />
          </g>
        );
      })}

      {[
        [78,86,-30],[64,76,-34],[94,108,-22],[70,114,-18],
        [162,86,30],[176,76,34],[146,108,22],[170,114,18],
        [104,76,-18],[136,76,18],[108,118,-14],[132,118,14],
        [38,108,-34],[202,108,34],
      ].map(([x, y, r], i) => (
        <ellipse key={`leaf-${i}`} cx={x} cy={y} rx="7" ry="2.8"
                 transform={`rotate(${r} ${x} ${y})`} />
      ))}

      {[88, 98, 142, 152].map((x, i) => (
        <circle key={`bud-${i}`} cx={x} cy={i % 2 ? 62 : 68} r="2" fill={color} />
      ))}
    </g>
  </svg>
);

const CornerVine = ({ color, w = 200 }) => (
  <svg viewBox="0 0 200 380" width={w} height={w * 380 / 200} aria-hidden="true">
    <g fill="none" stroke={color} strokeWidth="0.7" strokeLinecap="round" opacity="0.55">
      <path d="M30 0 Q 50 60, 40 130 Q 30 200, 60 260 Q 80 320, 50 380" />
      <path d="M40 50 Q 25 55, 15 70" /><path d="M40 50 Q 60 55, 70 70" />
      <path d="M42 110 Q 25 118, 18 135" /><path d="M42 110 Q 60 118, 72 135" />
      <path d="M38 175 Q 22 185, 16 205" /><path d="M38 175 Q 58 185, 68 205" />
      <path d="M50 240 Q 32 250, 25 270" /><path d="M50 240 Q 70 250, 78 270" />
      <path d="M60 310 Q 42 320, 35 340" /><path d="M60 310 Q 80 320, 88 340" />
      {[[18,68,-30],[68,68,30],[20,135,-30],[70,135,30],
        [18,200,-30],[68,200,30],[28,268,-30],[78,268,30],
        [38,338,-30],[88,338,30]].map(([x,y,r],i)=>(
        <ellipse key={i} cx={x} cy={y} rx="6" ry="2.4"
                 transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </g>
  </svg>
);

// arrow between cards
const StepArrow = ({ color }) => (
  <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true">
    <path d="M2 7 H 22 M 16 2 L 22 7 L 16 12" fill="none"
          stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── card components ──────────────────────────────────────────────────────
function Card({ n, title, subtitle, children, palette, dim, active, sprig = true }) {
  return (
    <div className={`rsvp-card ${dim ? 'is-dim' : ''} ${active ? 'is-active' : ''}`}>
      <div className="rsvp-card-num">{n}. {title}</div>
      {subtitle && <div className="rsvp-card-sub">{subtitle}</div>}
      <div className="rsvp-card-body">{children}</div>
      {sprig && (
        <div className="rsvp-card-sprig" style={{ color: palette.sprig }}>
          <Sprig color={palette.sprig} w={70} />
        </div>
      )}
    </div>
  );
}

function FindNameCard({ name, setName, onFind, palette, found, dim }) {
  const ref = useRef(null);
  return (
    <Card n="1" title="FIND YOUR NAME"
          subtitle={<>Enter your name as it appears<br/>on your invitation.</>}
          palette={palette} dim={dim} active={!dim && !found}>
      <input
        ref={ref}
        className="rsvp-input"
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onFind(); }}
      />
      <button
        className="rsvp-btn rsvp-btn-primary"
        disabled={!name.trim()}
        onClick={onFind}
      >
        {found ? '✓ FOUND' : 'FIND ME'}
      </button>
    </Card>
  );
}

function RsvpCard({ response, setResponse, palette, dim }) {
  return (
    <Card n="2" title="RSVP" subtitle="Will you be joining us?"
          palette={palette} dim={dim} active={!dim && !response}>
      <button
        className={`rsvp-btn ${response === 'accepts' ? 'rsvp-btn-primary' : 'rsvp-btn-ghost'}`}
        onClick={() => setResponse('accepts')}
      >
        {response === 'accepts' && <span style={{marginRight:8}}>✓</span>}
        JOYFULLY ACCEPTS
      </button>
      <button
        className={`rsvp-btn ${response === 'declines' ? 'rsvp-btn-primary' : 'rsvp-btn-ghost'}`}
        onClick={() => setResponse('declines')}
        style={{ marginTop: 10 }}
      >
        {response === 'declines' && <span style={{marginRight:8}}>✓</span>}
        DECLINES WITH REGRET
      </button>
    </Card>
  );
}

function DetailsCard({ meal, setMeal, dietary, setDietary, notes, setNotes,
                       meals, response, palette, dim }) {
  if (response === 'declines') {
    return (
      <Card n="3" title="DETAILS" subtitle="We'll miss you dearly."
            palette={palette} dim={dim} active={!dim}>
        <div className="rsvp-label">A note for the couple</div>
        <textarea className="rsvp-textarea" rows="4"
                  placeholder="Share a note..."
                  value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Card>
    );
  }
  return (
    <Card n="3" title="DETAILS" subtitle="Help us plan the best day ever!"
          palette={palette} dim={dim} active={!dim}>
      <div className="rsvp-label">Meal Preference</div>
      <div className="rsvp-select-wrap">
        <select className="rsvp-select" value={meal}
                onChange={(e) => setMeal(e.target.value)}>
          <option value="" disabled>Select an option</option>
          {meals.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <svg className="rsvp-select-chev" width="12" height="8" viewBox="0 0 12 8">
          <path d="M1 1 L 6 6 L 11 1" fill="none" stroke="currentColor"
                strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="rsvp-label" style={{ marginTop: 14 }}>Any Dietary Restrictions?</div>
      <input className="rsvp-input rsvp-input-sm" type="text"
             placeholder="Let us know..." value={dietary}
             onChange={(e) => setDietary(e.target.value)} />
      <div className="rsvp-label" style={{ marginTop: 14 }}>Notes for the couple</div>
      <input className="rsvp-input rsvp-input-sm" type="text"
             placeholder="Share a note..." value={notes}
             onChange={(e) => setNotes(e.target.value)} />
    </Card>
  );
}

function AllSetCard({ canSubmit, submitting, submitted, error, onSubmit,
                      palette, tweaks }) {
  return (
    <div className={`rsvp-card rsvp-card-allset ${submitted ? 'is-done' : ''}`}>
      <div className="rsvp-card-num" style={{ color: palette.allSetText }}>
        4. {submitted ? "YOU'RE ALL SET" : 'ALL SET?'}
      </div>
      {!submitted && (
        <div className="rsvp-card-sub" style={{ color: palette.allSetText, opacity: .85 }}>
          Review your details, then send.
        </div>
      )}
      <div className="rsvp-allset-body">
        {submitted ? (
          <>
            <div className="rsvp-allset-art" style={{ color: palette.allSetText }}>
              <FloralBouquet color={palette.allSetText} w={210} />
            </div>
            <div className="rsvp-allset-heart" style={{ color: palette.allSetText }}>♡</div>
            <div className="rsvp-allset-thanks" style={{ color: palette.allSetText }}>
              Thank you!
            </div>
            <div className="rsvp-allset-msg" style={{ color: palette.allSetText }}>
              We can't wait to<br/>celebrate with you.
            </div>
          </>
        ) : (
          <>
            <div className="rsvp-allset-art" style={{ color: palette.allSetText, opacity: .65 }}>
              <FloralBouquet color={palette.allSetText} w={180} />
            </div>
            <button
              className="rsvp-btn rsvp-btn-submit"
              disabled={!canSubmit || submitting}
              onClick={onSubmit}
            >
              {submitting ? 'SENDING…' : 'SEND RSVP'}
            </button>
            {error && <div className="rsvp-allset-err">{error}</div>}
            {!canSubmit && !submitting && (
              <div className="rsvp-allset-hint" style={{ color: palette.allSetText }}>
                Complete the steps to send.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── footer info pill ─────────────────────────────────────────────────────
function FooterPill({ icon, label, l1, l2 }) {
  return (
    <div className="ft-pill">
      <div className="ft-pill-ico">{icon}</div>
      <div className="ft-pill-lbl">{label}</div>
      <div className="ft-pill-l1">{l1}</div>
      <div className="ft-pill-l2">{l2}</div>
    </div>
  );
}

// ─── main app ─────────────────────────────────────────────────────────────
window.RsvpApp = function RsvpApp({ palette, tweaks }) {
  const [name, setName] = useState('');
  const [found, setFound] = useState(false);
  const [response, setResponse] = useState(''); // '' | 'accepts' | 'declines'
  const [meal, setMeal] = useState('');
  const [dietary, setDietary] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const meals = tweaks.meals.split(',').map((s) => s.trim()).filter(Boolean);

  const canSubmit = found && name.trim() &&
    (response === 'declines' || (response === 'accepts' && meal));

  const handleFind = () => setFound(true);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    const payload = {
      name: name.trim(),
      response,
      meal: response === 'accepts' ? meal : '',
      dietary: response === 'accepts' ? dietary : '',
      notes,
      userAgent: navigator.userAgent,
    };
    try {
      if (window.SHEETS_ENDPOINT) {
        // Send as a simple form POST so Apps Script can read e.parameter.
        // URLSearchParams uses a safelisted content type and avoids CORS preflight.
        const fd = new URLSearchParams();
        Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ''));
        await fetch(window.SHEETS_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          body: fd,
        });
      } else {
        // Demo mode — simulate a roundtrip
        await new Promise((r) => setTimeout(r, 700));
        console.log('[RSVP demo submit]', payload);
      }
      setSubmitted(true);
    } catch (e) {
      setError("Couldn't send. Please try again or text us.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rsvp-grid">
      <FindNameCard
        name={name} setName={setName} onFind={handleFind}
        found={found} palette={palette} dim={submitted}
      />
      <div className="rsvp-arrow"><StepArrow color={palette.arrow} /></div>

      <RsvpCard
        response={response} setResponse={setResponse}
        palette={palette} dim={!found || submitted}
      />
      <div className="rsvp-arrow"><StepArrow color={palette.arrow} /></div>

      <DetailsCard
        meal={meal} setMeal={setMeal}
        dietary={dietary} setDietary={setDietary}
        notes={notes} setNotes={setNotes}
        meals={meals} response={response}
        palette={palette} dim={!response || submitted}
      />
      <div className="rsvp-arrow"><StepArrow color={palette.arrow} /></div>

      <AllSetCard
        canSubmit={canSubmit} submitting={submitting}
        submitted={submitted} error={error}
        onSubmit={handleSubmit}
        palette={palette} tweaks={tweaks}
      />
    </div>
  );
};

window.RsvpCornerVine = CornerVine;
window.RsvpSprig = Sprig;
