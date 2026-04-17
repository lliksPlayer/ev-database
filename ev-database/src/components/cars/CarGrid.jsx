import CarCard from './CarCard'
import './CarGrid.css'

export default function CarGrid({ cars, fields, size, onCarClick }) {
  return (
    <div className={`car-grid ${size}`}>
      {cars.map(car => (
        <CarCard key={car.id} car={car} fields={fields} onClick={() => onCarClick(car)} />
      ))}
    </div>
  )
}
