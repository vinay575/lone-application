import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Accordion({ items }) {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <div className="accordion">
      {items.map((item, i) => (
        <div className="acc-item" key={item.id ?? i}>
          <button
            className="acc-q"
            onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
            aria-expanded={openIdx === i}
          >
            <span>{item.question}</span>
            {openIdx === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {openIdx === i && <div className="acc-a">{item.answer}</div>}
        </div>
      ))}
    </div>
  );
}
