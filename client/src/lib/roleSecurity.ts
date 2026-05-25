import { normalizeRole } from './roles';

export interface TeacherClassAssignment {
  className: string;
  branch: string;
  section: string;
}

/**
 * Returns the class, branch, and section assignment for a faculty teacher.
 * Now reads branch from user object (populated from auth-service).
 */
export function getTeacherClassAssignment(user: any): TeacherClassAssignment {
  if (!user) {
    return { className: '', branch: '', section: '' };
  }
  
  return {
    className: '',
    branch: user.branch || '',
    section: ''
  };
}

/**
 * Determines if a given role has read-only access (cannot add/edit/delete data).
 */
export function isReadOnlyRole(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  return ['teacher', 'counselor', 'principal', 'hod'].includes(r);
}

/**
 * Filters a list of students based on the logged-in user's role and scopes.
 */
export function filterStudentsForUser(students: any[], user: any): any[] {
  if (!user || !students) return [];
  
  const role = normalizeRole(user.role);
  
  // Admin and Principal see all students
  if (role === 'admin' || role === 'principal') {
    return students;
  }
  
  // Teacher and HOD see students from their branch (all sections)
  if (role === 'teacher' || role === 'hod') {
    if (!user.branch) return students; // No branch assigned, show all as fallback
    return students.filter(s => 
      s &&
      s.branch &&
      s.branch.toLowerCase() === user.branch.toLowerCase()
    );
  }
  
  // Counselor sees only their assigned students
  if (role === 'counselor') {
    return students.filter(s => 
      s &&
      s.counselorUsername && 
      s.counselorUsername.toLowerCase() === user.username.toLowerCase()
    );
  }
  
  // Student sees only their own profile
  if (role === 'student') {
    return students.filter(s => 
      s &&
      (s.username === user.username || s.rollNumber === user.username)
    );
  }
  
  return [];
}
