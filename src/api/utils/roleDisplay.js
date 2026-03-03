/**
 * Rol uchun mobil ilovada ko'rsatiladigan nom.
 * SELLER = Sotuvchi, ADMIN = Admin, USER = Foydalanuvchi.
 */
function getRoleDisplayName(role) {
  const r = (role || 'USER').toUpperCase();
  switch (r) {
    case 'SELLER':
      return 'Sotuvchi';
    case 'ADMIN':
      return 'Admin';
    case 'USER':
    default:
      return 'Foydalanuvchi';
  }
}

module.exports = { getRoleDisplayName };
