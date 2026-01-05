import { supabase, DbBugReport } from '../supabaseClient';
import { BugReport } from '../../app/types';

// ============================================
// BUG REPORTS
// ============================================

/**
 * Obtener todos los bug reports (solo admin)
 */
export async function getAllBugReports(): Promise<BugReport[]> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bug reports:', error);
    throw error;
  }

  return (data || []).map(dbBugReportToBugReport);
}

/**
 * Obtener bug reports del usuario actual
 */
export async function getUserBugReports(userId: string): Promise<BugReport[]> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user bug reports:', error);
    throw error;
  }

  return (data || []).map(dbBugReportToBugReport);
}

/**
 * Obtener un bug report por ID
 */
export async function getBugReportById(id: string): Promise<BugReport | null> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching bug report:', error);
    return null;
  }

  return data ? dbBugReportToBugReport(data) : null;
}

/**
 * Crear un nuevo bug report
 */
export async function createBugReport(report: Omit<BugReport, 'id' | 'createdAt'>): Promise<BugReport | null> {
  const { data, error } = await supabase
    .from('bug_reports')
    .insert({
      id: `bug_${Date.now()}`,
      user_id: report.userId,
      user_email: report.userEmail,
      user_name: report.userName,
      title: report.title,
      description: report.description,
      category: report.category,
      priority: report.priority,
      status: report.status || 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating bug report:', error);
    throw error;
  }

  return data ? dbBugReportToBugReport(data) : null;
}

/**
 * Actualizar el estado de un bug report (solo admin)
 */
export async function updateBugReportStatus(
  id: string,
  status: BugReport['status'],
  adminNotes?: string
): Promise<BugReport | null> {
  const updateData: any = { status };
  
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }
  
  if (status === 'resolved' || status === 'closed') {
    updateData.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('bug_reports')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating bug report status:', error);
    throw error;
  }

  return data ? dbBugReportToBugReport(data) : null;
}

/**
 * Actualizar un bug report completo (solo admin)
 */
export async function updateBugReport(id: string, updates: Partial<BugReport>): Promise<BugReport | null> {
  const updateData: any = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { data, error } = await supabase
    .from('bug_reports')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating bug report:', error);
    throw error;
  }

  return data ? dbBugReportToBugReport(data) : null;
}

/**
 * Eliminar un bug report (solo admin)
 */
export async function deleteBugReport(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('bug_reports')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting bug report:', error);
    throw error;
  }

  return true;
}

/**
 * Filtrar bug reports por estado
 */
export async function filterBugReportsByStatus(status: BugReport['status']): Promise<BugReport[]> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error filtering bug reports by status:', error);
    throw error;
  }

  return (data || []).map(dbBugReportToBugReport);
}

/**
 * Filtrar bug reports por prioridad
 */
export async function filterBugReportsByPriority(priority: BugReport['priority']): Promise<BugReport[]> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('priority', priority)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error filtering bug reports by priority:', error);
    throw error;
  }

  return (data || []).map(dbBugReportToBugReport);
}

/**
 * Filtrar bug reports por categoría
 */
export async function filterBugReportsByCategory(category: BugReport['category']): Promise<BugReport[]> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error filtering bug reports by category:', error);
    throw error;
  }

  return (data || []).map(dbBugReportToBugReport);
}

/**
 * Obtener estadísticas de bug reports (para el admin)
 */
export async function getBugReportsStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
}> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('status, priority, category');

  if (error) {
    console.error('Error fetching bug reports stats:', error);
    throw error;
  }

  const total = data?.length || 0;
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  data?.forEach(report => {
    byStatus[report.status] = (byStatus[report.status] || 0) + 1;
    byPriority[report.priority] = (byPriority[report.priority] || 0) + 1;
    byCategory[report.category] = (byCategory[report.category] || 0) + 1;
  });

  return {
    total,
    byStatus,
    byPriority,
    byCategory
  };
}

// ============================================
// FUNCIONES DE CONVERSIÓN
// ============================================

function dbBugReportToBugReport(db: DbBugReport): BugReport {
  return {
    id: db.id,
    userId: db.user_id,
    userEmail: db.user_email,
    userName: db.user_name,
    title: db.title,
    description: db.description,
    category: db.category,
    priority: db.priority,
    status: db.status,
    createdAt: db.created_at
  };
}
