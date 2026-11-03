export default function Field({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  required,
  children,
  options,
  full,
  ...rest
}) {
  return (
    <div className={`field ${full ? 'full' : ''}`}>
      <label htmlFor={name}>
        {label} {required && <span className="req">*</span>}
      </label>
      {children ? (
        children
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          className={error ? 'invalid' : ''}
          {...rest}
        >
          {(options || []).map((o) =>
            typeof o === 'string' ? (
              <option key={o} value={o}>
                {o}
              </option>
            ) : (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            )
          )}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          rows={rest.rows || 4}
          value={value ?? ''}
          onChange={onChange}
          className={error ? 'invalid' : ''}
          {...rest}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          className={error ? 'invalid' : ''}
          {...rest}
        />
      )}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err">{error}</span>}
    </div>
  );
}
