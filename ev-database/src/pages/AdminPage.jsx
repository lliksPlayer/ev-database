import { logout } from '../firebase/auth'
import AdminPanel from '../components/admin/AdminPanel'
import './AdminPage.css'

export default function AdminPage() {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <button
          className="btn btn-secondary"
          onClick={logout}
          style={{ padding: '4px 14px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}
        >
          Logout
        </button>
      </div>
      <AdminPanel />
    </div>
  )
}
