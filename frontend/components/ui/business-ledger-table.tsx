'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, Database } from 'lucide-react';

export interface LedgerActivity {
  id: number;
  client_name: string;
  action: string;
  amount: number | string;
  status: string;
  notes?: string;
  created_at?: string;
  synced_to_supabase?: boolean;
}

interface BusinessLedgerTableProps {
  activities: LedgerActivity[];
  onDelete?: (id: number) => void;
  onPrintReport?: () => void;
}

export function BusinessLedgerTable({
  activities,
  onDelete,
  onPrintReport,
}: BusinessLedgerTableProps) {
  const totalAmount = activities.reduce(
    (sum, act) => sum + (Number(act.amount) || 0),
    0
  );

  const getStatusBadge = (status: string, action: string) => {
    const s = (status || '').toLowerCase();
    const a = (action || '').toLowerCase();

    if (s.includes('fail') || s.includes('cancel')) {
      return <Badge variant="failed">Failed</Badge>;
    }
    if (a.includes('payment') || s.includes('paid') || s.includes('complete')) {
      return <Badge variant="paid">Paid</Badge>;
    }
    if (s.includes('pend') || a.includes('visit')) {
      return <Badge variant="pending">Pending</Badge>;
    }
    return <Badge variant="unpaid">Unpaid</Badge>;
  };

  if (activities.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 bg-white/50">
        <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-slate-700">No Transactions Recorded Yet</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Speak your first order or payment in your language above to populate your official business ledger.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full shadow-sm rounded-2xl overflow-hidden bg-white border border-slate-200/90">
      <Table className="min-w-[620px]">
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead className="font-semibold text-slate-500 text-xs w-[30%]">Client / Customer</TableHead>
            <TableHead className="font-semibold text-slate-500 text-xs text-center w-[15%]">Status</TableHead>
            <TableHead className="font-semibold text-slate-500 text-xs w-[18%]">Activity Type</TableHead>
            <TableHead className="font-semibold text-slate-500 text-xs w-[25%]">Bilingual Notes</TableHead>
            <TableHead className="font-semibold text-slate-500 text-xs text-right w-[12%]">Amount</TableHead>
            {onDelete && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {activities.map((act) => (
            <TableRow key={act.id} className="hover:bg-slate-50/70 transition-colors">
              <TableCell className="font-semibold text-slate-900">
                <div className="flex flex-col">
                  <span>{act.client_name || 'Walk-in Client'}</span>
                  {act.created_at && (
                    <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                      {act.created_at.slice(0, 10)}
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell className="text-center">
                {getStatusBadge(act.status, act.action)}
              </TableCell>

              <TableCell className="text-slate-600 capitalize">
                <span className="text-xs font-medium">
                  {act.action === 'payment' ? 'Payment Collection' : act.action === 'visit' ? 'Field Meeting' : 'Customer Order'}
                </span>
              </TableCell>

              <TableCell className="text-slate-500 text-xs max-w-xs truncate" title={act.notes || '—'}>
                {act.notes || '—'}
              </TableCell>

              <TableCell className="font-bold text-slate-900 text-right font-mono text-sm">
                ₹{Number(act.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>

              {onDelete && (
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(act.id)}
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow className="bg-slate-50/90 font-bold border-t border-slate-200">
            <TableCell colSpan={4} className="text-slate-900 font-bold text-sm py-4">
              Total Budget / Verified Revenue ({activities.length} entries)
            </TableCell>
            <TableCell className="text-right text-slate-950 font-bold font-mono text-base py-4" colSpan={onDelete ? 2 : 1}>
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

export default BusinessLedgerTable;
