import React from 'react'

/**
 * ScrollableSelect
 * Reusable select component that switches to a scrollable listbox style when
 * option count exceeds a threshold or when `multiple`/`forceList` is true.
 *
 * Props:
 * - options: [{ value, label }]
 * - value: string|number|Array (controlled)
 * - onChange: handler (receives value or array)
 * - multiple: enable multi-select (listbox style)
 * - sizeThreshold: number of rows before enabling scroll list (default 8)
 * - forceList: force listbox rendering regardless of count
 * - placeholder: placeholder label for single select
 * - name, disabled: passthrough
 */
export default function ScrollableSelect({
  options = [],
  value,
  onChange,
  multiple = false,
  sizeThreshold = 8,
  forceList = false,
  disabled = false,
  name,
  placeholder = 'Select…'
}) {
  const isListMode = multiple || forceList || (options.length > sizeThreshold)

  const handleChange = (e) => {
    if (multiple) {
      const selected = Array.from(e.target.selectedOptions).map(o => o.value)
      onChange(selected)
    } else {
      onChange(e.target.value)
    }
  }

  if (!isListMode && !multiple) {
    return (
      <select
        className="scroll-select"
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  const size = Math.min(options.length, sizeThreshold)

  return (
    <select
      className="scroll-select list-mode"
      name={name}
      value={value}
      onChange={handleChange}
      multiple={multiple}
      size={size > 4 ? size : 5}
      disabled={disabled}
    >
      {!multiple && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
