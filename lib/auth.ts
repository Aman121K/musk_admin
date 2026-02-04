/**
 * Check if the current user is an admin
 */
export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) return false;
    
    const user = JSON.parse(adminUser);
    return user.role === 'admin';
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
}

/**
 * Get the current admin user
 */
export function getAdminUser(): { id: string; name: string; email: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) return null;
    
    return JSON.parse(adminUser);
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('adminToken');
}
