# Frontend

## ScrollableSelect Component
Reusable select that automatically becomes a scrollable listbox when option count exceeds a threshold (default 8) or when `multiple`/`forceList` is set.

### Props
- `options`: Array of `{ value, label }` items.
- `value`: Controlled value (string | number | array for multiple).
- `onChange(next)`: Called with new value or array.
- `multiple`: Enable multi-selection listbox.
- `sizeThreshold`: Max visible rows before listbox scroll (default 8).
- `forceList`: Force listbox rendering even if below threshold.
- `placeholder`: Placeholder for single select non-list mode.
- `name`, `disabled`: Passed through.

### Usage Example
```jsx
import ScrollableSelect from './components/ScrollableSelect'

<ScrollableSelect
  value={selectedClass}
  onChange={setSelectedClass}
  options={classes.map(c => ({ value: String(c.id), label: `${c.level_display || c.level}${c.section?` ${c.section}`:''}` }))}
  sizeThreshold={10}
  placeholder="Select class…"
/>
```

For very large lists consider adding client-side filtering above the component.

### Styling
Global styles add `.scroll-select.list-mode` with internal vertical scroll and compact option padding.

