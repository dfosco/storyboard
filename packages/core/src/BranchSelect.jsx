const selectStyle = {
  width: '100%',
  appearance: 'none',
  backgroundColor: 'var(--bgColor-default, #0d1117)',
  color: 'var(--fgColor-default, #e6edf3)',
  border: '1px solid var(--borderColor-default, #30363d)',
  borderRadius: '8px',
  padding: '8px 32px 8px 12px',
  fontSize: '13px',
  fontFamily: 'inherit',
  cursor: 'pointer',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23848d97'%3E%3Cpath d='M6 8.5L1.5 4h9L6 8.5z'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  transition: 'border-color 0.15s ease',
}

const disabledStyle = {
  ...selectStyle,
  opacity: 0.5,
  cursor: 'not-allowed',
}

export default function BranchSelect({
  branches = [],
  value,
  onChange,
  disabled,
  id,
  placeholder,
  ref,
}) {
  return (
    <select
      ref={ref}
      id={id}
      style={disabled ? disabledStyle : selectStyle}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {branches.length === 0 && (
        <option value="" disabled>{placeholder || 'No branches available'}</option>
      )}
      {branches.map((branch) => (
        <option key={branch} value={branch}>{branch}</option>
      ))}
    </select>
  )
}
