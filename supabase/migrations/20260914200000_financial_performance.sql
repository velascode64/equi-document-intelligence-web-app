create table public.financial_performance (
  id uuid primary key default extensions.gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  fund text,
  manager text,
  document_type text check (document_type in ('fund_factsheet', 'account_statement', 'performance_report')),
  reporting_date date,
  strategy text,
  aum numeric,
  nav numeric,
  ending_balance numeric,
  ytd_return numeric,
  since_inception numeric,
  created_at timestamptz not null default now()
);

create index financial_performance_document_id_idx on public.financial_performance(document_id);
create index financial_performance_fund_idx on public.financial_performance(fund);
create index financial_performance_reporting_date_idx on public.financial_performance(reporting_date);

alter table public.financial_performance enable row level security;

create policy "financial_performance_select_own"
on public.financial_performance for select
using (
  exists (
    select 1
    from public.documents
    where documents.id = financial_performance.document_id
      and documents.user_id = auth.uid()
  )
);

create policy "financial_performance_insert_own"
on public.financial_performance for insert
with check (
  exists (
    select 1
    from public.documents
    where documents.id = financial_performance.document_id
      and documents.user_id = auth.uid()
  )
);

create policy "financial_performance_update_own"
on public.financial_performance for update
using (
  exists (
    select 1
    from public.documents
    where documents.id = financial_performance.document_id
      and documents.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.documents
    where documents.id = financial_performance.document_id
      and documents.user_id = auth.uid()
  )
);

create policy "financial_performance_delete_own"
on public.financial_performance for delete
using (
  exists (
    select 1
    from public.documents
    where documents.id = financial_performance.document_id
      and documents.user_id = auth.uid()
  )
);
