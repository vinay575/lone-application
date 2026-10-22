import { APP_FLOW } from '../lib/constants.js';
import { formatDateTime } from '../lib/format.js';

export default function StatusTimeline({ status, history = [] }) {
  const byStatus = new Map(history.map((h) => [h.status, h]));
  const currentIdx = APP_FLOW.indexOf(status);

  return (
    <ul className="timeline">
      {APP_FLOW.map((s, i) => {
        const entry = byStatus.get(s);
        const done = entry || (currentIdx >= 0 && i < currentIdx);
        const current = s === status;
        return (
          <li key={s} className={done || current ? '' : 'pending'}>
            <div className="t-title">
              {s} {current && <span className="badge badge-review" style={{ marginLeft: 6 }}>Current</span>}
            </div>
            {entry ? (
              <>
                <div className="t-time">{formatDateTime(entry.at)}</div>
                {entry.note && <div className="t-note">{entry.note}</div>}
              </>
            ) : (
              <div className="t-time">Pending</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
