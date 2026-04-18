import { useTranslation } from 'react-i18next'
import { logout } from '../firebase/auth'
import AdminPanel from '../components/admin/AdminPanel'
import './AdminPage.css'

export default function AdminPage() {
  const { t } = useTranslation()
  return (
    <div className="admin-page">
      <div className="admin-header">
        <button className="btn btn-secondary btn-small admin-logout" onClick={logout}>
          {t('admin.logout')}
        </button>
      </div>
      <AdminPanel />
    </div>
  )
}
