import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { saveSettings } from '../../firebase/settings'
import './FieldToggle.css'

function SortableField({ field, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.key })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className={`field-item ${isDragging ? 'dragging' : ''}`}>
      <span className="drag-handle" {...attributes} {...listeners}>⠿</span>
      <span className="field-label">{field.label_de} / {field.label_en}</span>
      <label className="field-toggle-switch">
        <input type="checkbox" checked={field.visible} onChange={() => onToggle(field.key)} />
        <span className="slider" />
      </label>
    </div>
  )
}

export default function FieldToggle({ fields }) {
  const { t } = useTranslation()
  const [localFields, setLocalFields] = useState([...fields].sort((a, b) => a.order - b.order))
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = localFields.findIndex(f => f.key === active.id)
    const newIdx = localFields.findIndex(f => f.key === over.id)
    setLocalFields(arrayMove(localFields, oldIdx, newIdx))
  }

  const handleToggle = (key) =>
    setLocalFields(prev => prev.map(f => f.key === key ? { ...f, visible: !f.visible } : f))

  const handleSave = async () => {
    setSaving(true)
    const updated = localFields.map((f, i) => ({ ...f, order: i }))
    await saveSettings(updated)
    setSaving(false)
  }

  return (
    <div className="field-toggle">
      <h2>{t('admin.fields')}</h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localFields.map(f => f.key)} strategy={verticalListSortingStrategy}>
          <div className="field-list">
            {localFields.map(f => (
              <SortableField key={f.key} field={f} onToggle={handleToggle} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="save-btn-row">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? t('admin.saving') : t('admin.save')}
        </button>
      </div>
    </div>
  )
}
