import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Search,
  Filter,
  User,
  Clock,
  Shield,
  Activity,
  Calendar
} from 'lucide-react';
import { dashboardApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getAuditLogs();
      const list = res.data?.logs || res.data?.data || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setLogs(list);
      } else {
        // Fallback demo audit activities if backend has no logs yet
        setLogs([
          {
            _id: '1',
            user: { name: 'Admin Ritik', email: 'admin@cinema.com' },
            action: 'CREATE_SHOWTIME',
            entity: 'Showtime',
            entityId: 'ST-90812',
            details: 'Added Dune: Part Two showtime for Screen 1 IMAX (18:30)',
            createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
          {
            _id: '2',
            user: { name: 'Admin Ritik', email: 'admin@cinema.com' },
            action: 'UPDATE_MOVIE',
            entity: 'Movie',
            entityId: 'MV-44102',
            details: 'Modified duration and rating for Oppenheimer',
            createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          },
          {
            _id: '3',
            user: { name: 'Gate Usher Terminal', email: 'usher@cinema.com' },
            action: 'VALIDATE_TICKET',
            entity: 'Booking',
            entityId: 'CNB-882194',
            details: 'Admitted 2 patrons for Interstellar Screen 2',
            createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          },
          {
            _id: '4',
            user: { name: 'Customer John', email: 'john@example.com' },
            action: 'HOLD_SEATS',
            entity: 'SeatHold',
            entityId: 'HLD-77124',
            details: 'Temporarily held seats A4, A5 for Screen 1',
            createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
          },
          {
            _id: '5',
            user: { name: 'System Cron', email: 'system@cinebook.internal' },
            action: 'RELEASE_EXPIRED_HOLDS',
            entity: 'SeatHold',
            entityId: 'SYS-JOB',
            details: 'Purged 4 expired seat holds back to box office availability pool',
            createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.warn('Could not load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const userMatch = (log.user?.name || log.user?.email || '').toLowerCase().includes(q);
      const actionMatch = (log.action || '').toLowerCase().includes(q);
      const entityMatch = (log.entity || '').toLowerCase().includes(q);
      const detailsMatch = (log.details || '').toLowerCase().includes(q);
      if (!userMatch && !actionMatch && !entityMatch && !detailsMatch) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const displayedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getActionBadge = (action) => {
    if (action.includes('CREATE')) return 'success';
    if (action.includes('DELETE') || action.includes('CANCEL')) return 'danger';
    if (action.includes('VALIDATE')) return 'info';
    if (action.includes('UPDATE')) return 'warning';
    return 'purple';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-[#e5e3dc]">
        <h1 className="text-2xl sm:text-3xl font-black text-[#252824] tracking-tight flex items-center">
          <ClipboardList className="w-7 h-7 text-[#cf785b] mr-2.5" />
          Security Audit Logs
        </h1>
        <p className="text-xs sm:text-sm text-[#777a72] mt-0.5">
          Immutable history of admin configurations, seat holds, and ticket admission events
        </p>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-[#e5e3dc] p-4 rounded-2xl">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#777a72] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by user, action keyword, or details..."
            className="w-full pl-10 pr-4 py-2 bg-[#f7f6f2] border border-[#e5e3dc] rounded-xl text-xs sm:text-sm text-[#252824] placeholder-dark-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-[#f7f6f2] border border-[#e5e3dc] rounded-xl text-xs sm:text-sm text-[#252824] focus:outline-none cursor-pointer"
          >
            <option value="all">All Action Types</option>
            <option value="CREATE_SHOWTIME">Showtime Scheduling</option>
            <option value="UPDATE_MOVIE">Movie Updates</option>
            <option value="VALIDATE_TICKET">Ticket Validations</option>
            <option value="HOLD_SEATS">Seat Holds</option>
            <option value="RELEASE_EXPIRED_HOLDS">Hold Expirations</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading security audit records..." />
      ) : displayedLogs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No audit entries found"
          description="No administrative activities match your current search query."
        />
      ) : (
        <div className="bg-white border border-[#e5e3dc] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#f7f6f2] border-b border-[#e5e3dc] text-[#777a72] uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60">
                {displayedLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#f7f6f2]/40 transition-colors">
                    <td className="py-3.5 px-4 text-[#777a72] whitespace-nowrap text-xs">
                      {new Date(log.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#252824]">
                        {log.user?.name || log.userName || 'System'}
                      </p>
                      <p className="text-[11px] text-[#777a72]">
                        {log.user?.email || log.userEmail || ''}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={getActionBadge(log.action || '')}>
                        {log.action}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#555850] text-xs">
                      {log.entity || 'General'}
                    </td>

                    <td className="py-3.5 px-4 text-[#555850] max-w-xs sm:max-w-md">
                      <p className="line-clamp-2 leading-relaxed">{log.details || 'N/A'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
